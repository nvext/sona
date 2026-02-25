import { and, eq, ilike, or } from "drizzle-orm";
import { createError } from "h3";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { productTypes } from "~~/server/domain/product-card/const";
import { db } from "~~/server/infrastructure/db/connection";
import { productCards, productCardsStaging } from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedBody } from "~~/server/infrastructure/http/api/validation";
import { resolveOrCreateOpenDraft, touchDraftUpdatedAt } from "~~/server/infrastructure/http/api/admin-catalog-draft";

const createCardBodySchema = z.object({
    draftId: z.string().trim().optional(),
    id: z.string().trim().min(1).optional(),
    type: z.enum(productTypes),
    slug: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    isActive: z.boolean().default(true),
});

export default defineApiHandler(async (event) => {
    const admin = await requireAdmin(event);
    const input = await readValidatedBody(event, createCardBodySchema);
    const draftId = await resolveOrCreateOpenDraft({ draftId: input.draftId, userId: admin.userId });
    const cardId = input.id ?? randomUUID();

    const [liveById, stagedById, liveBySlug, stagedBySlug] = await Promise.all([
        db.select({ id: productCards.id }).from(productCards).where(eq(productCards.id, cardId)).limit(1),
        db
            .select({ id: productCardsStaging.id, op: productCardsStaging.op })
            .from(productCardsStaging)
            .where(and(eq(productCardsStaging.draftId, draftId), eq(productCardsStaging.id, cardId)))
            .limit(1),
        db.select({ id: productCards.id }).from(productCards).where(ilike(productCards.slug, input.slug)).limit(1),
        db
            .select({ id: productCardsStaging.id, op: productCardsStaging.op })
            .from(productCardsStaging)
            .where(
                and(
                    eq(productCardsStaging.draftId, draftId),
                    ilike(productCardsStaging.slug, input.slug),
                    or(eq(productCardsStaging.op, "create"), eq(productCardsStaging.op, "update")),
                ),
            )
            .limit(1),
    ]);

    if (liveById.length > 0 || (stagedById.length > 0 && stagedById[0]?.op !== "delete")) {
        throw createError({ statusCode: 409, statusMessage: "Card id already exists" });
    }

    const slugTakenByLive = liveBySlug.some((row) => row.id !== cardId);
    const slugTakenByStaging = stagedBySlug.some((row) => row.id !== cardId);
    if (slugTakenByLive || slugTakenByStaging) {
        throw createError({ statusCode: 409, statusMessage: "Card slug already exists" });
    }

    const now = new Date();
    await db
        .insert(productCardsStaging)
        .values({
            draftId,
            id: cardId,
            type: input.type,
            slug: input.slug,
            title: input.title,
            description: input.description,
            isActive: input.isActive,
            op: "create",
            rowVersion: 1,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [productCardsStaging.draftId, productCardsStaging.id],
            set: {
                type: input.type,
                slug: input.slug,
                title: input.title,
                description: input.description,
                isActive: input.isActive,
                op: "create",
                rowVersion: 1,
                updatedAt: now,
            },
        });

    await touchDraftUpdatedAt(draftId);

    return {
        draftId,
        card: {
            id: cardId,
            type: input.type,
            slug: input.slug,
            title: input.title,
            description: input.description,
            isActive: input.isActive,
            hasDraft: true,
        },
    };
});
