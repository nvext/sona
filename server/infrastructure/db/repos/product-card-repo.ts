import { ProductCard } from "~~/server/domain/product-card/entity";
import { ProductCardRepo } from "~~/server/domain/product-card/repo";
import { productCards } from "../schema";
import { PgBaseRepo } from "./base";

export class PgProductCardRepo
    extends PgBaseRepo<ProductCard>
    implements ProductCardRepo
{
    constructor() {
        super(productCards);
    }
}
