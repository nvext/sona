import { BaseRepo } from "../base";
import { RepoResponse } from "../base/types";
import { Cart } from "./entity";

export interface CartRepo extends BaseRepo<Cart> {
    getByUserId(parameters: { userId: string }): Promise<RepoResponse<Cart | null>>;
}
