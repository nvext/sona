import { CartItemRepo } from "~~/server/domain/cart-item/repo";
import { CartRepo } from "~~/server/domain/cart/repo";
import { NotFoundError } from "~~/server/shared/errors";

export class RemoveItemFromCart {
    constructor(
        private readonly cartItemRepo: CartItemRepo,
        private readonly cartRepo: CartRepo,
    ) {}

    async execute(input: RemoveItemFromCartInput) {
        const { data: cartItem } = await this.cartItemRepo.getById({ id: input.itemId });

        if (cartItem === null) {
            throw new NotFoundError("Cart item not found");
        }

        const { data: cart } = await this.cartRepo.getById({ id: cartItem.cartId });
        if (cart === null || cart.userId !== input.userId) {
            throw new NotFoundError("Cart item not found");
        }

        if (cartItem.quantity <= 1) {
            return await this.cartItemRepo.delete({ id: cartItem.id });
        }

        return await this.cartItemRepo.adjustQuantity({ id: cartItem.id, delta: -1 });
    }
}

type RemoveItemFromCartInput = {
    itemId: string;
    userId: string;
};
