import { eq } from "drizzle-orm";
import { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";
import { ProductSnapshotRepo } from "~~/server/domain/product-snapshot/repo";
import { RepoResponse } from "~~/server/domain/base/types";
import { db } from "../connection";
import { productSnapshots } from "../schema";
import { PgBaseRepo } from "./base";

export class PgProductSnapshotRepo
    extends PgBaseRepo<ProductSnapshot>
    implements ProductSnapshotRepo
{
    constructor() {
        super(productSnapshots);
    }

    async getByOrderRequestId(parameters: { orderRequestId: string }): Promise<RepoResponse<ProductSnapshot[]>> {
        const rows = await db
            .select()
            .from(productSnapshots)
            .where(eq(productSnapshots.orderRequestId, parameters.orderRequestId));

        return {
            data: rows as ProductSnapshot[],
            meta: undefined,
        };
    }
}
