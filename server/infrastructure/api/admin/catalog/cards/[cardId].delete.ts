import { and, eq } from "drizzle-orm";
import { getQuery } from "h3";
import { z } from "zod";
import { db } from "~~/server/infrastructure/db/connection";
import {
    productCards,
    productCardsStaging,
    productColorsStaging,
    productsStaging,
} from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { resolveOrCreateOpenDraft, touchDraftUpdatedAt } from "~~/server/infrastructure/http/api/admin-catalog-draft";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedParam } from "~~/server/infrastructure/http/api/validation";

const cardIdSchema = z.string().trim().min(1);
const deleteCardQuerySchema = z.object({
    draftId: z.string().trim().optional(),
});

export default defineApiHandler(async (event) => {
    const admin = await requireAdmin(event);
    const cardId = readValidatedParam(event, "cardId", cardIdSchema);
    const query = deleteCardQuerySchema.parse(getQuery(event));
    const draftId = await resolveOrCreateOpenDraft({ draftId: query.draftId, userId: admin.userId });

    const [liveCard, stagedCard] = await Promise.all([
        db.select().from(productCards).where(eq(productCards.id, cardId)).limit(1),
        db
            .select()
            .from(productCardsStaging)
            .where(and(eq(productCardsStaging.draftId, draftId), eq(productCardsStaging.id, cardId)))
            .limit(1),
    ]);

    const current = stagedCard[0] ?? liveCard[0];
    if (!current) {
        return {
            draftId,
            deleted: false,
            reason: "not_found",
        };
    }

    const now = new Date();
    if (stagedCard[0]?.op === "create" && !liveCard[0]) {
        await db.transaction(async (tx) => {
            await tx
                .delete(productsStaging)
                .where(and(eq(productsStaging.draftId, draftId), eq(productsStaging.cardId, cardId)));
            await tx
                .delete(productColorsStaging)
                .where(and(eq(productColorsStaging.draftId, draftId), eq(productColorsStaging.productCardId, cardId)));
            await tx
                .delete(productCardsStaging)
                .where(and(eq(productCardsStaging.draftId, draftId), eq(productCardsStaging.id, cardId)));
        });

        await touchDraftUpdatedAt(draftId);
        return {
            draftId,
            deleted: true,
            removedFromDraftOnly: true,
        };
    }

    await db
        .insert(productCardsStaging)
        .values({
            draftId,
            id: cardId,
            type: current.type,
            slug: current.slug,
            title: current.title,
            description: current.description,
            isActive: false,
            op: "delete",
            rowVersion: (stagedCard[0]?.rowVersion ?? 0) + 1,
            createdAt: current.createdAt,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [productCardsStaging.draftId, productCardsStaging.id],
            set: {
                op: "delete",
                isActive: false,
                rowVersion: (stagedCard[0]?.rowVersion ?? 0) + 1,
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
