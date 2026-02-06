import { CartItemSnapshot } from "./types";

export interface CartItem {
    id: string;
    cartId: string;
    productId: string;
    quantity: number;

    snapshot: CartItemSnapshot
}
