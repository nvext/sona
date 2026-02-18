import { eq } from "drizzle-orm";
import { RepoResponse } from "~~/server/domain/base/types";
import { Cart } from "~~/server/domain/cart/entity";
import { CartRepo } from "~~/server/domain/cart/repo";
import { db } from "../connection";
import { carts } from "../schema";
import { PgBaseRepo } from "./base";

export class PgCartRepo extends PgBaseRepo<Cart> implements CartRepo {
    constructor() {
        super(carts);
    }

    async getByUserId(parameters: { userId: string }): Promise<RepoResponse<Cart | null>> {
        const [row] = await db.select().from(carts).where(eq(carts.userId, parameters.userId)).limit(1);
        return { data: (row as Cart | undefined) ?? null, meta: undefined };
    }
}
