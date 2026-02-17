import { RepoResponse } from "~~/server/domain/base/types";
import { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";

export interface CaptureCartSnapshotQuery {
    execute(parameters: { cartId: string, orderRequestId: string }): Promise<RepoResponse<ProductSnapshot[]>>;
}