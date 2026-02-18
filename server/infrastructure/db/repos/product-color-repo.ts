import { eq } from "drizzle-orm";
import { RepoResponse } from "~~/server/domain/base/types";
import { ProductColor } from "~~/server/domain/product-color/entity";
import { ProductColorRepo } from "~~/server/domain/product-color/repo";
import { db } from "../connection";
import { productColors } from "../schema";
import { PgBaseRepo } from "./base";

export class PgProductColorRepo
    extends PgBaseRepo<ProductColor>
    implements ProductColorRepo
{
    constructor() {
        super(productColors);
    }

    async getByProductCardId(parameters: {
        productCardId: string;
    }): Promise<RepoResponse<ProductColor[]>> {
        const rows = await db
            .select()
            .from(productColors)
            .where(eq(productColors.productCardId, parameters.productCardId));

        return { data: rows as ProductColor[], meta: undefined };
    }
}
