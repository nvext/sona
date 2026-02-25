import { and, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { readValidatedQuery } from "~~/server/infrastructure/http/api/validation";
import { db } from "~~/server/infrastructure/db/connection";
import { files, filesStaging } from "~~/server/infrastructure/db/schema";

const filesQuerySchema = z.object({
    draftId: z.string().trim().optional(),
    query: z.string().trim().optional(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});

export default defineApiHandler(async (event) => {
    await requireAdmin(event);
    const input = readValidatedQuery(event, filesQuerySchema);

    const filters = [];
    if (input.query && input.query.length > 0) {
        filters.push(
            or(ilike(files.originalName, `%${input.query}%`), ilike(files.url, `%${input.query}%`))!,
        );
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const liveRows = await db
        .select()
        .from(files)
        .where(where)
        .orderBy(desc(files.updatedAt), desc(files.createdAt))
        .offset(input.offset)
        .limit(input.limit);

    const stagedRows = input.draftId
        ? await db.select().from(filesStaging).where(eq(filesStaging.draftId, input.draftId))
        : [];

    const merged = new Map(liveRows.map((row) => [row.id, { ...row, hasDraft: false }]));
    for (const staged of stagedRows) {
        if (staged.op === "delete") {
            merged.delete(staged.id);
            continue;
        }
        const existing = merged.get(staged.id);
        merged.set(staged.id, {
            ...(existing ?? staged),
            ...staged,
            hasDraft: true,
        });
    }

    return {
        items: [...merged.values()],
        pagination: {
            offset: input.offset,
            limit: input.limit,
            total: [...merged.values()].length,
        },
    };
});
