import { and, eq, ilike, ne, or } from "drizzle-orm";
import { createError } from "h3";
import { z } from "zod";
import { productTypes } from "~~/server/domain/product-card/const";
import { db } from "~~/server/infrastructure/db/connection";
import { productCards, productCardsStaging } from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedBody, readValidatedParam } from "~~/server/infrastructure/http/api/validation";
import { resolveOrCreateOpenDraft, touchDraftUpdatedAt } from "~~/server/infrastructure/http/api/admin-catalog-draft";

const cardIdSchema = z.string().trim().min(1);
const updateCardBodySchema = z
    .object({
        draftId: z.string().trim().optional(),
        type: z.enum(productTypes).optional(),
        slug: z.string().trim().min(1).optional(),
        title: z.string().trim().min(1).optional(),
        description: z.string().trim().min(1).optional(),
        isActive: z.boolean().optional(),
    })
    .refine(
        (input) =>
            input.type !== undefined ||
            input.slug !== undefined ||
            input.title !== undefined ||
            input.description !== undefined ||
            input.isActive !== undefined,
        { message: "Nothing to update" },
    );

export default defineApiHandler(async (event) => {
    const admin = await requireAdmin(event);
    const cardId = readValidatedParam(event, "cardId", cardIdSchema);
    const input = await readValidatedBody(event, updateCardBodySchema);
    const draftId = await resolveOrCreateOpenDraft({ draftId: input.draftId, userId: admin.userId });

    const [liveCard, stagedCard] = await Promise.all([
        db.select().from(productCards).where(eq(productCards.id, cardId)).limit(1),
        db
            .select()
            .from(productCardsStaging)
            .where(and(eq(productCardsStaging.draftId, draftId), eq(productCardsStaging.id, cardId)))
            .limit(1),
    ]);

    const current = stagedCard[0] ?? liveCard[0];
    if (!current || stagedCard[0]?.op === "delete") {
        throw createError({ statusCode: 404, statusMessage: "Card not found" });
    }

    const next = {
        type: input.type ?? current.type,
        slug: input.slug ?? current.slug,
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        isActive: input.isActive ?? current.isActive,
    };

    if (input.slug !== undefined) {
        const [liveConflict, stagedConflict] = await Promise.all([
            db
                .select({ id: productCards.id })
                .from(productCards)
                .where(and(ilike(productCards.slug, input.slug), ne(productCards.id, cardId)))
                .limit(1),
            db
                .select({ id: productCardsStaging.id })
                .from(productCardsStaging)
                .where(
                    and(
                        eq(productCardsStaging.draftId, draftId),
                        ilike(productCardsStaging.slug, input.slug),
                        ne(productCardsStaging.id, cardId),
                        or(eq(productCardsStaging.op, "create"), eq(productCardsStaging.op, "update")),
                    ),
                )
                .limit(1),
        ]);

        if (liveConflict.length > 0 || stagedConflict.length > 0) {
            throw createError({ statusCode: 409, statusMessage: "Card slug already exists" });
        }
    }

    const now = new Date();
    const nextOp = stagedCard[0]?.op === "create" ? "create" : "update";
    const nextRowVersion = (stagedCard[0]?.rowVersion ?? 0) + 1;

    await db
        .insert(productCardsStaging)
        .values({
            draftId,
            id: cardId,
            type: next.type,
            slug: next.slug,
            title: next.title,
            description: next.description,
            isActive: next.isActive,
            op: nextOp,
            rowVersion: nextRowVersion,
            createdAt: liveCard[0]?.createdAt ?? stagedCard[0]?.createdAt ?? now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [productCardsStaging.draftId, productCardsStaging.id],
            set: {
                type: next.type,
                slug: next.slug,
                title: next.title,
                description: next.description,
                isActive: next.isActive,
                op: nextOp,
                rowVersion: nextRowVersion,
                updatedAt: now,
            },
        });

    await touchDraftUpdatedAt(draftId);

    return {
        draftId,
        card: {
            id: cardId,
            ...next,
            hasDraft: true,
        },
    };
});
