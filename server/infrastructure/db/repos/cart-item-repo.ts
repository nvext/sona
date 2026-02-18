import { and, eq, sql } from "drizzle-orm";
import { RepoResponse } from "~~/server/domain/base/types";
import { CartItem } from "~~/server/domain/cart-item/entity";
import { CartItemRepo } from "~~/server/domain/cart-item/repo";
import { db } from "../connection";
import { cartItems } from "../schema";
import { PgBaseRepo } from "./base";

export class PgCartItemRepo extends PgBaseRepo<CartItem> implements CartItemRepo {
    constructor() {
        super(cartItems);
    }

    async getByKey(parameters: {
        key: { cartId: string; productId: string; productColorId: string };
    }): Promise<RepoResponse<CartItem | null>> {
        const [row] = await db
            .select()
            .from(cartItems)
            .where(
                and(
                    eq(cartItems.cartId, parameters.key.cartId),
                    eq(cartItems.productId, parameters.key.productId),
                    eq(cartItems.productColorId, parameters.key.productColorId),
                ),
            )
            .limit(1);

        return { data: (row as CartItem | undefined) ?? null, meta: undefined };
    }

    async getByCartId(parameters: { cartId: string }): Promise<RepoResponse<CartItem[]>> {
        const rows = await db.select().from(cartItems).where(eq(cartItems.cartId, parameters.cartId));
        return { data: rows as CartItem[], meta: undefined };
    }

    async adjustQuantity(parameters: {
        id: string;
        delta: number;
    }): Promise<RepoResponse<CartItem | null>> {
        const [updated] = await db
            .update(cartItems)
            .set({
                quantity: sql`${cartItems.quantity} + ${parameters.delta}`,
                updatedAt: new Date(),
            })
            .where(eq(cartItems.id, parameters.id))
            .returning();

        return { data: (updated as CartItem | undefined) ?? null, meta: undefined };
    }
}
