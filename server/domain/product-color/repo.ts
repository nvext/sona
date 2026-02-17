import { BaseRepo } from "../base";
import { RepoResponse } from "../base/types";
import { ProductColor } from "./entity";

export interface ProductColorRepo extends BaseRepo<ProductColor> {
    getByProductCardId(parameters: {
        productCardId: string;
    }): Promise<RepoResponse<ProductColor[]>>;
}
