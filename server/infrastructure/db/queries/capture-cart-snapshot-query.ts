import { eq, inArray } from "drizzle-orm";
import { RepoResponse } from "~~/server/domain/base/types";
import { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";
import { CaptureCartSnapshotQuery } from "~~/server/application/checkout/queries/capture-cart-snapshot";
import { db } from "../connection";
import { cartItems, productCards, productColors, products } from "../schema";

export class DbCaptureCartSnapshotQuery implements CaptureCartSnapshotQuery {
    async execute(parameters: {
        cartId: string;
        orderRequestId: string;
    }): Promise<RepoResponse<ProductSnapshot[]>> {
        const items = await db.select().from(cartItems).where(eq(cartItems.cartId, parameters.cartId));

        if (items.length === 0) {
            return { data: [], meta: undefined };
        }

        const productIds = Array.from(new Set(items.map((item) => item.productId)));
        const colorIds = Array.from(new Set(items.map((item) => item.productColorId)));
        const cardIds = Array.from(new Set(items.map((item) => item.productCardId)));

        const productRows = await db.select().from(products).where(inArray(products.id, productIds));
        const colorRows = await db.select().from(productColors).where(inArray(productColors.id, colorIds));
        const cardRows = await db.select().from(productCards).where(inArray(productCards.id, cardIds));

        const productsById = new Map(productRows.map((row) => [row.id, row]));
        const colorsById = new Map(colorRows.map((row) => [row.id, row]));
        const cardsById = new Map(cardRows.map((row) => [row.id, row]));

        const capturedAt = new Date();
        const snapshots: ProductSnapshot[] = [];

        for (const item of items) {
            const product = productsById.get(item.productId);
            const color = colorsById.get(item.productColorId);
            const card = cardsById.get(item.productCardId);

            if (!product || !color || !card) {
                continue;
            }

            snapshots.push({
                id: `${parameters.orderRequestId}:${item.id}`,
                orderRequestId: parameters.orderRequestId,
                productId: product.id,
                title: card.title,
                description: card.description,
                colorId: color.id,
                colorName: color.name,
                colorHex: color.hex,
                imageIds: color.imageIds,
                width: product.width,
                height: product.height,
                thickness: product.thickness,
                quantity: item.quantity,
                price: product.price,
                currency: product.currency,
                capturedAt,
            });
        }

        return { data: snapshots, meta: undefined };
    }
}
