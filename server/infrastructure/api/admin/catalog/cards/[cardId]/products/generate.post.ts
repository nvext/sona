import { and, eq, inArray, sql } from "drizzle-orm";
import { createError } from "h3";
import { z } from "zod";
import { currencies } from "~~/server/shared/const";
import { db } from "~~/server/infrastructure/db/connection";
import { productColors, productColorsStaging, products, productsStaging } from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { resolveOrCreateOpenDraft, touchDraftUpdatedAt } from "~~/server/infrastructure/http/api/admin-catalog-draft";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedBody, readValidatedParam } from "~~/server/infrastructure/http/api/validation";

const cardIdSchema = z.string().trim().min(1);
const generateProductsBodySchema = z.object({
    draftId: z.string().trim().optional(),
    sizes: z
        .array(
            z.object({
                width: z.coerce.number().int().positive(),
                height: z.coerce.number().int().positive(),
            }),
        )
        .min(1),
    thicknesses: z.array(z.coerce.number().int().positive()).min(1),
    colorIds: z.array(z.string().trim().min(1)).optional(),
    price: z.coerce.number().int().nonnegative(),
    currency: z.enum(currencies),
    isActive: z.boolean().default(true),
});

function buildProductId(cardId: string, colorId: string, width: number, height: number, thickness: number): string {
    return `${cardId}-${colorId}-${width}x${height}x${thickness}`;
}

export default defineApiHandler(async (event) => {
    const admin = await requireAdmin(event);
    const cardId = readValidatedParam(event, "cardId", cardIdSchema);
    const input = await readValidatedBody(event, generateProductsBodySchema);
    const draftId = await resolveOrCreateOpenDraft({ draftId: input.draftId, userId: admin.userId });

    const [liveColors, stagedColors] = await Promise.all([
        db.select().from(productColors).where(eq(productColors.productCardId, cardId)),
        db
            .select()
            .from(productColorsStaging)
            .where(and(eq(productColorsStaging.draftId, draftId), eq(productColorsStaging.productCardId, cardId))),
    ]);

    const mergedColors = new Map(liveColors.map((row) => [row.id, row]));
    for (const staged of stagedColors) {
        if (staged.op === "delete") {
            mergedColors.delete(staged.id);
            continue;
        }
        mergedColors.set(staged.id, { ...(mergedColors.get(staged.id) ?? staged), ...staged });
    }

    const requestedColorIds = input.colorIds?.length ? input.colorIds : [...mergedColors.keys()];
    const unknownColorId = requestedColorIds.find((id) => !mergedColors.has(id));
    if (unknownColorId) {
        throw createError({ statusCode: 400, statusMessage: `Unknown color id: ${unknownColorId}` });
    }

    const now = new Date();
    const stagedExisting = await db
        .select()
        .from(productsStaging)
        .where(and(eq(productsStaging.draftId, draftId), eq(productsStaging.cardId, cardId)));
    const stagedById = new Map(stagedExisting.map((row) => [row.id, row]));
    const liveRows = await db.select().from(products).where(eq(products.cardId, cardId));
    const liveById = new Map(liveRows.map((row) => [row.id, row]));

    const rowsToUpsert: Array<typeof productsStaging.$inferInsert> = [];
    const generatedIds = new Set<string>();
    for (const colorId of requestedColorIds) {
        for (const size of input.sizes) {
            for (const thickness of input.thicknesses) {
                const id = buildProductId(cardId, colorId, size.width, size.height, thickness);
                generatedIds.add(id);
                const staged = stagedById.get(id);
                const live = liveById.get(id);
                const nextOp = staged?.op === "create" || (!live && !staged) ? "create" : "update";
                rowsToUpsert.push({
                    draftId,
                    id,
                    cardId,
                    productColorId: colorId,
                    width: size.width,
                    height: size.height,
                    thickness,
                    price: input.price,
                    currency: input.currency,
                    isActive: input.isActive,
                    op: nextOp,
                    rowVersion: (staged?.rowVersion ?? 0) + 1,
                    createdAt: live?.createdAt ?? staged?.createdAt ?? now,
                    updatedAt: now,
                });
            }
        }
    }

    const affectedExistingIds = stagedExisting
        .filter((row) => requestedColorIds.includes(row.productColorId))
        .map((row) => row.id);
    const liveExistingIds = liveRows
        .filter((row) => requestedColorIds.includes(row.productColorId))
        .map((row) => row.id);
    const existingIds = new Set([...affectedExistingIds, ...liveExistingIds]);
    const toDeleteIds = [...existingIds].filter((id) => !generatedIds.has(id));
    const liveDeleteIds = toDeleteIds.filter((id) => liveById.has(id));
    const stagedCreateDeleteIds = toDeleteIds.filter((id) => stagedById.get(id)?.op === "create" && !liveById.has(id));

    await db.transaction(async (tx) => {
        if (rowsToUpsert.length > 0) {
            await tx
                .insert(productsStaging)
                .values(rowsToUpsert)
                .onConflictDoUpdate({
                    target: [productsStaging.draftId, productsStaging.id],
                    set: {
                        cardId: sql`excluded.card_id`,
                        productColorId: sql`excluded.product_color_id`,
                        width: sql`excluded.width`,
                        height: sql`excluded.height`,
                        thickness: sql`excluded.thickness`,
                        price: sql`excluded.price`,
                        currency: sql`excluded.currency`,
                        isActive: sql`excluded.is_active`,
                        op: sql`excluded.op`,
                        rowVersion: sql`excluded.row_version`,
                        updatedAt: sql`excluded.updated_at`,
                    },
                });
        }

        if (stagedCreateDeleteIds.length > 0) {
            await tx
                .delete(productsStaging)
                .where(and(eq(productsStaging.draftId, draftId), inArray(productsStaging.id, stagedCreateDeleteIds)));
        }

        if (liveDeleteIds.length > 0) {
            const liveDeleteRows = liveRows.filter((row) => liveDeleteIds.includes(row.id));
            for (const row of liveDeleteRows) {
                const staged = stagedById.get(row.id);
                await tx
                    .insert(productsStaging)
                    .values({
                        draftId,
                        id: row.id,
                        cardId: row.cardId,
                        productColorId: row.productColorId,
                        width: row.width,
                        height: row.height,
                        thickness: row.thickness,
                        price: row.price,
                        currency: row.currency,
                        isActive: false,
                        op: "delete",
                        rowVersion: (staged?.rowVersion ?? 0) + 1,
                        createdAt: row.createdAt,
                        updatedAt: now,
                    })
                    .onConflictDoUpdate({
                        target: [productsStaging.draftId, productsStaging.id],
                        set: {
                            op: "delete",
                            rowVersion: (staged?.rowVersion ?? 0) + 1,
                            isActive: false,
                            updatedAt: now,
                        },
                    });
            }
        }
    });

    await touchDraftUpdatedAt(draftId);

    return {
        draftId,
        generated: rowsToUpsert.length,
        deleted: toDeleteIds.length,
    };
});
