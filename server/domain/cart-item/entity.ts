import { CartItemSnapshot } from "./types";

export interface CartItem {
  id: string;
  cartId: string;

  productCardId: string;
  productId: string;
  productColorId: string;

  quantity: number;

  createdAt: Date;
  updatedAt: Date;
}

