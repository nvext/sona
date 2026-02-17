import { BaseRepo } from "../base";
import { RepoResponse } from "../base/types";
import { CartItem } from "./entity";

export interface CartItemRepo extends BaseRepo<CartItem> {
    getByKey(parameters: {
        key: { cartId: string; productId: string; productColorId: string };
    }): Promise<RepoResponse<CartItem | null>>;

    getByCartId(parameters: { cartId: string }): Promise<RepoResponse<CartItem[]>>;

    adjustQuantity(parameters: {
        id: string;
        delta: number;
    }): Promise<RepoResponse<CartItem | null>>;
}
