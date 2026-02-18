import { eq } from "drizzle-orm";
import { RepoResponse } from "~~/server/domain/base/types";
import { Product } from "~~/server/domain/product/entity";
import { ProductRepo } from "~~/server/domain/product/repo";
import { db } from "../connection";
import { products } from "../schema";
import { PgBaseRepo } from "./base";

export class PgProductRepo extends PgBaseRepo<Product> implements ProductRepo {
    constructor() {
        super(products);
    }

    async getByProductCardId(parameters: { productCardId: string }): Promise<RepoResponse<Product[]>> {
        const rows = await db
            .select()
            .from(products)
            .where(eq(products.cardId, parameters.productCardId));

        return { data: rows as Product[], meta: undefined };
    }
}
