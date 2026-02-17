import { CartItemRepo } from "~~/server/domain/cart-item/repo";
import { NotFoundError } from "~~/server/shared/errors";

export class RemoveItemFromCart {
    constructor(private readonly cartItemRepo: CartItemRepo) {}

    async execute(input: RemoveItemFromCartInput) {
        const { data: cartItem } = await this.cartItemRepo.getById({ id: input.itemId });

        if (cartItem === null) {
            throw new NotFoundError();
        }

        return await this.cartItemRepo.adjustQuantity({ id: cartItem.id, delta: -1 });
    }
}

type RemoveItemFromCartInput = {
    itemId: string;
};
