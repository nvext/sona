import { BaseRepo } from "../base";
import { RepoResponse } from "../base/types";
import { ProductSnapshot } from "./entity";

export interface ProductSnapshotRepo extends BaseRepo<ProductSnapshot> {
    getByOrderRequestId(parameters: { orderRequestId: string }): Promise<RepoResponse<ProductSnapshot[]>>;
}
