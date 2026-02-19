import { RepoResponse } from "~~/server/domain/base/types";

export interface GetCartItemsQuery {
    execute(parameters: { userId: string }): Promise<RepoResponse<CartItemView[], { cartId: string | null }>>;
}

export type CartItemView = {
    id: string;
    productId: string;
    productColorId: string;
    title: string;
    colorName: string;
    colorHex: string;
    width: number;
    height: number;
    thickness: number;
    price: number;
    currency: "RUB";
    imageUrl: string | null;
    quantity: number;
};
