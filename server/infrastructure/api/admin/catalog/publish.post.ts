import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { createError } from "h3";
import { z } from "zod";
import { db } from "~~/server/infrastructure/db/connection";
import {
    catalogDrafts,
    files,
    filesStaging,
    productCards,
    productCardsStaging,
    productColors,
    productColorsStaging,
    products,
    productsStaging,
} from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedBody } from "~~/server/infrastructure/http/api/validation";
import { recordAdminPublishFailed, recordAdminPublishSucceeded } from "~~/server/infrastructure/runtime/metrics";

const publishBodySchema = z.object({
    draftId: z.string().trim().min(1),
});

export default defineApiHandler(async (event) => {
    await requireAdmin(event);
    const body = await readValidatedBody(event, publishBodySchema);
    const startedAt = Date.now();

    try {
        const summary = await db.transaction(async (tx) => {
            await tx.execute(sql`select pg_advisory_xact_lock(742991321)`);

        const [draft] = await tx
            .select()
            .from(catalogDrafts)
            .where(and(eq(catalogDrafts.id, body.draftId), eq(catalogDrafts.status, "open")))
            .limit(1);
        if (!draft) {
            throw createError({ statusCode: 404, statusMessage: "Open draft not found" });
        }

        const [stagedFiles, stagedCards, stagedColors, stagedProducts] = await Promise.all([
            tx.select().from(filesStaging).where(eq(filesStaging.draftId, body.draftId)),
            tx.select().from(productCardsStaging).where(eq(productCardsStaging.draftId, body.draftId)),
            tx.select().from(productColorsStaging).where(eq(productColorsStaging.draftId, body.draftId)),
            tx.select().from(productsStaging).where(eq(productsStaging.draftId, body.draftId)),
        ]);

        const filesToDelete = stagedFiles.filter((row) => row.op === "delete").map((row) => row.id);
        const cardsToDelete = stagedCards.filter((row) => row.op === "delete").map((row) => row.id);
        const colorsToDelete = stagedColors.filter((row) => row.op === "delete").map((row) => row.id);
        const productsToDelete = stagedProducts.filter((row) => row.op === "delete").map((row) => row.id);

        const filesToUpsert = stagedFiles.filter((row) => row.op !== "delete");
        const cardsToUpsert = stagedCards.filter((row) => row.op !== "delete");
        const colorsToUpsert = stagedColors.filter((row) => row.op !== "delete");
        const productsToUpsert = stagedProducts.filter((row) => row.op !== "delete");

        if (productsToDelete.length > 0) {
            await tx.delete(products).where(inArray(products.id, productsToDelete));
        }
        if (colorsToDelete.length > 0) {
            await tx.delete(productColors).where(inArray(productColors.id, colorsToDelete));
        }
        if (cardsToDelete.length > 0) {
            await tx.delete(productCards).where(inArray(productCards.id, cardsToDelete));
        }
        if (filesToDelete.length > 0) {
            await tx.delete(files).where(inArray(files.id, filesToDelete));
        }

        if (filesToUpsert.length > 0) {
            await tx
                .insert(files)
                .values(
                    filesToUpsert.map((row) => ({
                        id: row.id,
                        url: row.url,
                        storageProvider: row.storageProvider,
                        storageBucket: row.storageBucket,
                        storageKey: row.storageKey,
                        originalName: row.originalName,
                        mimeType: row.mimeType,
                        sizeBytes: row.sizeBytes,
                        width: row.width,
                        height: row.height,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt,
                    })),
                )
                .onConflictDoUpdate({
                    target: files.id,
                    set: {
                        url: sql`excluded.url`,
                        storageProvider: sql`excluded.storage_provider`,
                        storageBucket: sql`excluded.storage_bucket`,
                        storageKey: sql`excluded.storage_key`,
                        originalName: sql`excluded.original_name`,
                        mimeType: sql`excluded.mime_type`,
                        sizeBytes: sql`excluded.size_bytes`,
                        width: sql`excluded.width`,
                        height: sql`excluded.height`,
                        updatedAt: sql`excluded.updated_at`,
                    },
                });
        }

        if (cardsToUpsert.length > 0) {
            await tx
                .insert(productCards)
                .values(
                    cardsToUpsert.map((row) => ({
                        id: row.id,
                        type: row.type,
                        slug: row.slug,
                        title: row.title,
                        description: row.description,
                        isActive: row.isActive,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt,
                    })),
                )
                .onConflictDoUpdate({
                    target: productCards.id,
                    set: {
                        type: sql`excluded.type`,
                        slug: sql`excluded.slug`,
                        title: sql`excluded.title`,
                        description: sql`excluded.description`,
                        isActive: sql`excluded.is_active`,
                        updatedAt: sql`excluded.updated_at`,
                    },
                });
        }

        if (colorsToUpsert.length > 0) {
            await tx
                .insert(productColors)
                .values(
                    colorsToUpsert.map((row) => ({
                        id: row.id,
                        productCardId: row.productCardId,
                        name: row.name,
                        hex: row.hex,
                        imageIds: row.imageIds,
                        isActive: row.isActive,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt,
                    })),
                )
                .onConflictDoUpdate({
                    target: productColors.id,
                    set: {
                        productCardId: sql`excluded.product_card_id`,
                        name: sql`excluded.name`,
                        hex: sql`excluded.hex`,
                        imageIds: sql`excluded.image_ids`,
                        isActive: sql`excluded.is_active`,
                        updatedAt: sql`excluded.updated_at`,
                    },
                });
        }

        if (productsToUpsert.length > 0) {
            await tx
                .insert(products)
                .values(
                    productsToUpsert.map((row) => ({
                        id: row.id,
                        cardId: row.cardId,
                        productColorId: row.productColorId,
                        width: row.width,
                        height: row.height,
                        thickness: row.thickness,
                        price: row.price,
                        currency: row.currency,
                        isActive: row.isActive,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt,
                    })),
                )
                .onConflictDoUpdate({
                    target: products.id,
                    set: {
                        cardId: sql`excluded.card_id`,
                        productColorId: sql`excluded.product_color_id`,
                        width: sql`excluded.width`,
                        height: sql`excluded.height`,
                        thickness: sql`excluded.thickness`,
                        price: sql`excluded.price`,
                        currency: sql`excluded.currency`,
                        isActive: sql`excluded.is_active`,
                        updatedAt: sql`excluded.updated_at`,
                    },
                });
        }

        const now = new Date();
        await tx
            .update(catalogDrafts)
            .set({
                status: "published",
                updatedAt: now,
                publishedAt: now,
            })
            .where(and(eq(catalogDrafts.id, body.draftId), ne(catalogDrafts.status, "published")));

        return {
            files: { upserted: filesToUpsert.length, deleted: filesToDelete.length },
            productCards: { upserted: cardsToUpsert.length, deleted: cardsToDelete.length },
            productColors: { upserted: colorsToUpsert.length, deleted: colorsToDelete.length },
            products: { upserted: productsToUpsert.length, deleted: productsToDelete.length },
        };
        });

        recordAdminPublishSucceeded(Date.now() - startedAt);
        return {
            ok: true,
            draftId: body.draftId,
            summary,
        };
    } catch (error) {
        recordAdminPublishFailed();
        throw error;
    }
});
