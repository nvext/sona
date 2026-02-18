import { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";
import { ProductSnapshotRepo } from "~~/server/domain/product-snapshot/repo";
import { productSnapshots } from "../schema";
import { PgBaseRepo } from "./base";

export class PgProductSnapshotRepo
    extends PgBaseRepo<ProductSnapshot>
    implements ProductSnapshotRepo
{
    constructor() {
        super(productSnapshots);
    }
}
