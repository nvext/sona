import { and, eq, inArray } from "drizzle-orm";
import { createError } from "h3";
import { z } from "zod";
import { db } from "~~/server/infrastructure/db/connection";
import { files, filesStaging, productColors, productColorsStaging } from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedBody, readValidatedParam } from "~~/server/infrastructure/http/api/validation";
import { resolveOrCreateOpenDraft, touchDraftUpdatedAt } from "~~/server/infrastructure/http/api/admin-catalog-draft";

const colorIdSchema = z.string().trim().min(1);
const updateColorBodySchema = z
    .object({
        draftId: z.string().trim().optional(),
        name: z.string().trim().min(1).optional(),
        hex: z.string().trim().regex(/^#?[0-9a-fA-F]{6}$/).optional(),
        imageIds: z.array(z.string().trim().min(1)).optional(),
        isActive: z.boolean().optional(),
    })
    .refine(
        (input) =>
            input.name !== undefined ||
            input.hex !== undefined ||
            input.imageIds !== undefined ||
            input.isActive !== undefined,
        { message: "Nothing to update" },
    );

export default defineApiHandler(async (event) => {
    const admin = await requireAdmin(event);
    const colorId = readValidatedParam(event, "colorId", colorIdSchema);
    const input = await readValidatedBody(event, updateColorBodySchema);
    const draftId = await resolveOrCreateOpenDraft({ draftId: input.draftId, userId: admin.userId });

    const [liveColor, stagedColor] = await Promise.all([
        db.select().from(productColors).where(eq(productColors.id, colorId)).limit(1),
        db
            .select()
            .from(productColorsStaging)
            .where(and(eq(productColorsStaging.draftId, draftId), eq(productColorsStaging.id, colorId)))
            .limit(1),
    ]);

    const current = stagedColor[0] ?? liveColor[0];
    if (!current || stagedColor[0]?.op === "delete") {
        throw createError({ statusCode: 404, statusMessage: "Color not found" });
    }

    if (input.imageIds && input.imageIds.length > 0) {
        const [liveRows, stagedRows] = await Promise.all([
            db.select({ id: files.id }).from(files).where(inArray(files.id, input.imageIds)),
            db
                .select({ id: filesStaging.id, op: filesStaging.op })
                .from(filesStaging)
                .where(and(eq(filesStaging.draftId, draftId), inArray(filesStaging.id, input.imageIds))),
        ]);

        const known = new Set([
            ...liveRows.map((row) => row.id),
            ...stagedRows.filter((row) => row.op !== "delete").map((row) => row.id),
        ]);

        const unknown = input.imageIds.find((id) => !known.has(id));
        if (unknown) {
            throw createError({ statusCode: 400, statusMessage: `Unknown image id: ${unknown}` });
        }
    }

    const next = {
        name: input.name ?? current.name,
        hex: input.hex ? (input.hex.startsWith("#") ? input.hex : `#${input.hex}`) : current.hex,
        imageIds: input.imageIds ?? current.imageIds,
        isActive: input.isActive ?? current.isActive,
        productCardId: current.productCardId,
    };
    const now = new Date();
    const nextOp = stagedColor[0]?.op === "create" ? "create" : "update";
    const nextRowVersion = (stagedColor[0]?.rowVersion ?? 0) + 1;

    await db
        .insert(productColorsStaging)
        .values({
            draftId,
            id: colorId,
            productCardId: next.productCardId,
            name: next.name,
            hex: next.hex,
            imageIds: next.imageIds,
            isActive: next.isActive,
            op: nextOp,
            rowVersion: nextRowVersion,
            createdAt: liveColor[0]?.createdAt ?? stagedColor[0]?.createdAt ?? now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [productColorsStaging.draftId, productColorsStaging.id],
            set: {
                productCardId: next.productCardId,
                name: next.name,
                hex: next.hex,
                imageIds: next.imageIds,
                isActive: next.isActive,
                op: nextOp,
                rowVersion: nextRowVersion,
                updatedAt: now,
            },
        });

    await touchDraftUpdatedAt(draftId);

    return {
        draftId,
        color: {
            id: colorId,
            ...next,
            hasDraft: true,
        },
    };
});
