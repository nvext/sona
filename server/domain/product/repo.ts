import { BaseRepo } from "../base";
import { RepoResponse } from "../base/types";
import { Product } from "./entity";

export interface ProductRepo extends BaseRepo<Product> {
    getByProductCardId(parameters: { productCardId: string }): Promise<RepoResponse<Product[]>>;
}
