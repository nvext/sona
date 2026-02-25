import { and, eq } from "drizzle-orm";
import { createError, getQuery } from "h3";
import { z } from "zod";
import { db } from "~~/server/infrastructure/db/connection";
import { files, filesStaging } from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedParam } from "~~/server/infrastructure/http/api/validation";
import { resolveOrCreateOpenDraft, touchDraftUpdatedAt } from "~~/server/infrastructure/http/api/admin-catalog-draft";

const fileIdSchema = z.string().trim().min(1);
const deleteQuerySchema = z.object({
    draftId: z.string().trim().optional(),
});

export default defineApiHandler(async (event) => {
    const admin = await requireAdmin(event);
    const fileId = readValidatedParam(event, "fileId", fileIdSchema);
    const query = deleteQuerySchema.parse(getQuery(event));
    const draftId = await resolveOrCreateOpenDraft({ draftId: query.draftId, userId: admin.userId });

    const [liveFile, stagedFile] = await Promise.all([
        db.select().from(files).where(eq(files.id, fileId)).limit(1),
        db
            .select()
            .from(filesStaging)
            .where(and(eq(filesStaging.draftId, draftId), eq(filesStaging.id, fileId)))
            .limit(1),
    ]);

    if (!liveFile[0] && !stagedFile[0]) {
        throw createError({ statusCode: 404, statusMessage: "File not found" });
    }

    if (stagedFile[0]?.op === "create" && !liveFile[0]) {
        await db
            .delete(filesStaging)
            .where(and(eq(filesStaging.draftId, draftId), eq(filesStaging.id, fileId)));
        await touchDraftUpdatedAt(draftId);
        return {
            draftId,
            deleted: true,
            removedFromDraftOnly: true,
        };
    }

    const now = new Date();
    const base = stagedFile[0] ?? liveFile[0]!;
    await db
        .insert(filesStaging)
        .values({
            draftId,
            id: fileId,
            url: base.url,
            storageProvider: base.storageProvider,
            storageBucket: base.storageBucket,
            storageKey: base.storageKey,
            originalName: base.originalName,
            mimeType: base.mimeType,
            sizeBytes: base.sizeBytes,
            width: base.width,
            height: base.height,
            op: "delete",
            rowVersion: (stagedFile[0]?.rowVersion ?? 0) + 1,
            createdAt: base.createdAt,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [filesStaging.draftId, filesStaging.id],
            set: {
                op: "delete",
                rowVersion: (stagedFile[0]?.rowVersion ?? 0) + 1,
                updatedAt: now,
            },
        });

    await touchDraftUpdatedAt(draftId);
    return {
        draftId,
        deleted: true,
        removedFromDraftOnly: false,
    };
});
