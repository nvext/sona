import { and, eq, inArray } from "drizzle-orm";
import { GetCartItemsQuery } from "~~/server/application/cart/queries/get-cart-items";
import { RepoResponse } from "~~/server/domain/base/types";
import { db } from "../connection";
import { cartItems, carts, files, productCards, productColors, products } from "../schema";

export class DbGetCartItemsQuery implements GetCartItemsQuery {
    async execute(parameters: { userId: string }): Promise<
        RepoResponse<
            Array<{
                id: string;
                productId: string;
                productColorId: string;
                title: string;
                colorName: string;
                colorHex: string;
                width: number;
                height: number;
                thickness: number;
                price: number;
                currency: "RUB";
                imageUrl: string | null;
                quantity: number;
            }>,
            { cartId: string | null }
        >
    > {
        const [cart] = await db
            .select({ id: carts.id })
            .from(carts)
            .where(and(eq(carts.userId, parameters.userId), eq(carts.status, "active")))
            .limit(1);

        if (!cart) {
            return { data: [], meta: { cartId: null } };
        }

        const rows = await db
            .select({
                id: cartItems.id,
                productId: cartItems.productId,
                productColorId: cartItems.productColorId,
                quantity: cartItems.quantity,
                title: productCards.title,
                colorName: productColors.name,
                colorHex: productColors.hex,
                imageIds: productColors.imageIds,
                width: products.width,
                height: products.height,
                thickness: products.thickness,
                price: products.price,
                currency: products.currency,
            })
            .from(cartItems)
            .innerJoin(products, eq(products.id, cartItems.productId))
            .innerJoin(productColors, eq(productColors.id, cartItems.productColorId))
            .innerJoin(productCards, eq(productCards.id, cartItems.productCardId))
            .where(eq(cartItems.cartId, cart.id));

        const imageIds = Array.from(new Set(rows.flatMap((row) => row.imageIds ?? [])));
        const fileRows =
            imageIds.length === 0
                ? []
                : await db
                      .select({ id: files.id, url: files.url })
                      .from(files)
                      .where(inArray(files.id, imageIds));
        const filesById = new Map(fileRows.map((row) => [row.id, row.url]));

        const data = rows.map((row) => ({
            id: row.id,
            productId: row.productId,
            productColorId: row.productColorId,
            title: row.title,
            colorName: row.colorName,
            colorHex: row.colorHex,
            width: row.width,
            height: row.height,
            thickness: row.thickness,
            price: row.price,
            currency: row.currency as "RUB",
            imageUrl: row.imageIds?.[0] ? filesById.get(row.imageIds[0]) ?? null : null,
            quantity: row.quantity,
        }));

        return { data, meta: { cartId: cart.id } };
    }
}
