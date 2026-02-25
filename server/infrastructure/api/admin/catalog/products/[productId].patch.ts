import { and, eq } from "drizzle-orm";
import { createError } from "h3";
import { z } from "zod";
import { currencies } from "~~/server/shared/const";
import { db } from "~~/server/infrastructure/db/connection";
import { products, productsStaging } from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { resolveOrCreateOpenDraft, touchDraftUpdatedAt } from "~~/server/infrastructure/http/api/admin-catalog-draft";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedBody, readValidatedParam } from "~~/server/infrastructure/http/api/validation";

const productIdSchema = z.string().trim().min(1);
const patchProductBodySchema = z
    .object({
        draftId: z.string().trim().optional(),
        price: z.coerce.number().int().nonnegative().optional(),
        currency: z.enum(currencies).optional(),
        isActive: z.boolean().optional(),
    })
    .refine((input) => input.price !== undefined || input.currency !== undefined || input.isActive !== undefined, {
        message: "Nothing to update",
    });

export default defineApiHandler(async (event) => {
    const admin = await requireAdmin(event);
    const productId = readValidatedParam(event, "productId", productIdSchema);
    const input = await readValidatedBody(event, patchProductBodySchema);
    const draftId = await resolveOrCreateOpenDraft({ draftId: input.draftId, userId: admin.userId });

    const [liveRow, stagedRow] = await Promise.all([
        db.select().from(products).where(eq(products.id, productId)).limit(1),
        db
            .select()
            .from(productsStaging)
            .where(and(eq(productsStaging.draftId, draftId), eq(productsStaging.id, productId)))
            .limit(1),
    ]);

    const current = stagedRow[0] ?? liveRow[0];
    if (!current || stagedRow[0]?.op === "delete") {
        throw createError({ statusCode: 404, statusMessage: "Product not found" });
    }

    const now = new Date();
    const next = {
        price: input.price ?? current.price,
        currency: input.currency ?? current.currency,
        isActive: input.isActive ?? current.isActive,
    };
    const nextOp = stagedRow[0]?.op === "create" ? "create" : "update";

    await db
        .insert(productsStaging)
        .values({
            draftId,
            id: current.id,
            cardId: current.cardId,
            productColorId: current.productColorId,
            width: current.width,
            height: current.height,
            thickness: current.thickness,
            price: next.price,
            currency: next.currency,
            isActive: next.isActive,
            op: nextOp,
            rowVersion: (stagedRow[0]?.rowVersion ?? 0) + 1,
            createdAt: current.createdAt,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [productsStaging.draftId, productsStaging.id],
            set: {
                price: next.price,
                currency: next.currency,
                isActive: next.isActive,
                op: nextOp,
                rowVersion: (stagedRow[0]?.rowVersion ?? 0) + 1,
                updatedAt: now,
            },
        });

    await touchDraftUpdatedAt(draftId);
    return {
        draftId,
        product: {
            id: current.id,
            cardId: current.cardId,
            productColorId: current.productColorId,
            width: current.width,
            height: current.height,
            thickness: current.thickness,
            price: next.price,
            currency: next.currency,
            isActive: next.isActive,
            hasDraft: true,
        },
    };
});
