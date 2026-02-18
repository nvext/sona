import { readFileSync } from "node:fs";
import { notInArray, sql } from "drizzle-orm";
import { db } from "~~/server/infrastructure/db/connection";
import { files, productCards, productColors, products } from "~~/server/infrastructure/db/schema";
import { expandedCatalogSchema } from "./types";

const DEFAULT_EXPANDED_PATH = "server/infrastructure/admin/catalog/expanded.json";

function getArg(name: string): string | null {
    const index = process.argv.indexOf(name);
    if (index === -1) {
        return null;
    }
    return process.argv[index + 1] ?? null;
}

const inputPath = getArg("--in") ?? DEFAULT_EXPANDED_PATH;
const keepMissing = process.argv.includes("--keep-missing");
const pruneMissing = !keepMissing;
const dryRun = process.argv.includes("--dry-run");

const expandedRaw = readFileSync(inputPath, "utf8");
const expanded = expandedCatalogSchema.parse(JSON.parse(expandedRaw));
const now = new Date();

const fileRows = expanded.files.map((item) => ({
    id: item.id,
    url: item.url,
    storageProvider: null,
    storageBucket: null,
    storageKey: null,
    originalName: item.originalName,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
    width: item.width,
    height: item.height,
    createdAt: now,
    updatedAt: now,
}));

const cardRows = expanded.productCards.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
}));

const colorRows = expanded.productColors.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
}));

const productRows = expanded.products.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
}));

if (dryRun) {
    console.log(
        `[admin:catalog:sync] dry-run from ${inputPath}: files=${fileRows.length}, cards=${cardRows.length}, colors=${colorRows.length}, products=${productRows.length}, pruneMissing=${pruneMissing}`,
    );
    process.exit(0);
}

await db.transaction(async (tx) => {
    if (fileRows.length > 0) {
        await tx
            .insert(files)
            .values(fileRows)
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
                    updatedAt: now,
                },
            });
    }

    if (cardRows.length > 0) {
        await tx
            .insert(productCards)
            .values(cardRows)
            .onConflictDoUpdate({
                target: productCards.id,
                set: {
                    type: sql`excluded.type`,
                    slug: sql`excluded.slug`,
                    title: sql`excluded.title`,
                    description: sql`excluded.description`,
                    isActive: sql`excluded.is_active`,
                    updatedAt: now,
                },
            });
    }

    if (colorRows.length > 0) {
        await tx
            .insert(productColors)
            .values(colorRows)
            .onConflictDoUpdate({
                target: productColors.id,
                set: {
                    productCardId: sql`excluded.product_card_id`,
                    name: sql`excluded.name`,
                    hex: sql`excluded.hex`,
                    imageIds: sql`excluded.image_ids`,
                    isActive: sql`excluded.is_active`,
                    updatedAt: now,
                },
            });
    }

    if (productRows.length > 0) {
        await tx
            .insert(products)
            .values(productRows)
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
                    updatedAt: now,
                },
            });
    }

    if (pruneMissing) {
        const fileIds = fileRows.map((item) => item.id);
        const cardIds = cardRows.map((item) => item.id);
        const colorIds = colorRows.map((item) => item.id);
        const productIds = productRows.map((item) => item.id);

        if (fileIds.length > 0) {
            await tx.delete(files).where(notInArray(files.id, fileIds));
        } else {
            await tx.delete(files);
        }

        if (cardIds.length > 0) {
            await tx
                .update(productCards)
                .set({ isActive: false, updatedAt: now })
                .where(notInArray(productCards.id, cardIds));
        }
        if (colorIds.length > 0) {
            await tx
                .update(productColors)
                .set({ isActive: false, updatedAt: now })
                .where(notInArray(productColors.id, colorIds));
        }
        if (productIds.length > 0) {
            await tx
                .update(products)
                .set({ isActive: false, updatedAt: now })
                .where(notInArray(products.id, productIds));
        }
    }
});

console.log(
    `[admin:catalog:sync] synced from ${inputPath}: files=${fileRows.length}, cards=${cardRows.length}, colors=${colorRows.length}, products=${productRows.length}, pruneMissing=${pruneMissing}`,
);
