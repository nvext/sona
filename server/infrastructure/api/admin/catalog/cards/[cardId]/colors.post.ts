import { and, eq, inArray } from "drizzle-orm";
import { createError } from "h3";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "~~/server/infrastructure/db/connection";
import {
    files,
    filesStaging,
    productCards,
    productCardsStaging,
    productColors,
    productColorsStaging,
} from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedBody, readValidatedParam } from "~~/server/infrastructure/http/api/validation";
import { resolveOrCreateOpenDraft, touchDraftUpdatedAt } from "~~/server/infrastructure/http/api/admin-catalog-draft";

const cardIdSchema = z.string().trim().min(1);
const createColorBodySchema = z.object({
    draftId: z.string().trim().optional(),
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1),
    hex: z.string().trim().regex(/^#?[0-9a-fA-F]{6}$/),
    imageIds: z.array(z.string().trim().min(1)).default([]),
    isActive: z.boolean().default(true),
});

export default defineApiHandler(async (event) => {
    const admin = await requireAdmin(event);
    const cardId = readValidatedParam(event, "cardId", cardIdSchema);
    const input = await readValidatedBody(event, createColorBodySchema);
    const draftId = await resolveOrCreateOpenDraft({ draftId: input.draftId, userId: admin.userId });
    const colorId = input.id ?? randomUUID();

    const [liveCard, stagedCard] = await Promise.all([
        db.select({ id: productCards.id }).from(productCards).where(eq(productCards.id, cardId)).limit(1),
        db
            .select({ id: productCardsStaging.id, op: productCardsStaging.op })
            .from(productCardsStaging)
            .where(and(eq(productCardsStaging.draftId, draftId), eq(productCardsStaging.id, cardId)))
            .limit(1),
    ]);

    if (!liveCard[0] && (!stagedCard[0] || stagedCard[0].op === "delete")) {
        throw createError({ statusCode: 404, statusMessage: "Card not found" });
    }

    const [liveColor, stagedColor] = await Promise.all([
        db.select({ id: productColors.id }).from(productColors).where(eq(productColors.id, colorId)),
        db
            .select({ id: productColorsStaging.id, op: productColorsStaging.op })
            .from(productColorsStaging)
            .where(and(eq(productColorsStaging.draftId, draftId), eq(productColorsStaging.id, colorId)))
            .limit(1),
    ]);

    if (liveColor.length > 0 || (stagedColor[0] && stagedColor[0].op !== "delete")) {
        throw createError({ statusCode: 409, statusMessage: "Color id already exists" });
    }

    if (input.imageIds.length > 0) {
        const [liveFiles, stagedFiles] = await Promise.all([
            db.select({ id: files.id }).from(files).where(inArray(files.id, input.imageIds)),
            db
                .select({ id: filesStaging.id, op: filesStaging.op })
                .from(filesStaging)
                .where(and(eq(filesStaging.draftId, draftId), inArray(filesStaging.id, input.imageIds))),
        ]);
        const known = new Set([
            ...liveFiles.map((row) => row.id),
            ...stagedFiles.filter((row) => row.op !== "delete").map((row) => row.id),
        ]);
        const unknown = input.imageIds.find((id) => !known.has(id));
        if (unknown) {
            throw createError({ statusCode: 400, statusMessage: `Unknown image id: ${unknown}` });
        }
    }

    const now = new Date();
    const hex = input.hex.startsWith("#") ? input.hex : `#${input.hex}`;
    await db
        .insert(productColorsStaging)
        .values({
            draftId,
            id: colorId,
            productCardId: cardId,
            name: input.name,
            hex,
            imageIds: input.imageIds,
            isActive: input.isActive,
            op: "create",
            rowVersion: 1,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [productColorsStaging.draftId, productColorsStaging.id],
            set: {
                productCardId: cardId,
                name: input.name,
                hex,
                imageIds: input.imageIds,
                isActive: input.isActive,
                op: "create",
                rowVersion: 1,
                updatedAt: now,
            },
        });

    await touchDraftUpdatedAt(draftId);

    return {
        draftId,
        color: {
            id: colorId,
            productCardId: cardId,
            name: input.name,
            hex,
            imageIds: input.imageIds,
            isActive: input.isActive,
            hasDraft: true,
        },
    };
});
