import { CartItemRepo } from "~~/server/domain/cart-item/repo";
import { CartRepo } from "~~/server/domain/cart/repo";
import { ProductCardRepo } from "~~/server/domain/product-card/repo";
import { ProductColorRepo } from "~~/server/domain/product-color/repo";
import { ProductRepo } from "~~/server/domain/product/repo";
import { NotFoundError, ValidationError } from "~~/server/shared/errors";
import { EntityIdGenerator } from "~~/server/shared/id";

export class AddItemToCart {
    constructor(
        private readonly cartRepo: CartRepo,
        private readonly cartItemRepo: CartItemRepo,
        private readonly productRepo: ProductRepo,
        private readonly productCardRepo: ProductCardRepo,
        private readonly productColorRepo: ProductColorRepo,
        private readonly entityIdGenerator: EntityIdGenerator,
    ) {}

    async execute(input: AddProductToCartInput) {
        const now = new Date();
        const quantity = input.quantity ?? 1;

        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new ValidationError("Quantity must be a positive integer");
        }

        let { data: cart } = await this.cartRepo.getByUserId({ userId: input.userId });
        const { data: product } = await this.productRepo.getById({ id: input.productId });
        const { data: color } = await this.productColorRepo.getById({ id: input.productColorId });

        if (product === null || color === null) {
            throw new NotFoundError();
        }

        if (cart === null) {
            const created = await this.cartRepo.add({
                entity: {
                    id: this.entityIdGenerator.generate(),
                    userId: input.userId,
                    status: "active",
                    createdAt: now,
                    updatedAt: now,
                },
            });
            cart = created.data;
        }

        const { data: card } = await this.productCardRepo.getById({ id: product.cardId });

        if (card === null) {
            throw new NotFoundError();
        }

        const colorMatchesProduct = product.productColorId === color.id;
        const colorBelongsToCard = color.productCardId === card.id;

        if (!colorMatchesProduct || !colorBelongsToCard) {
            throw new ValidationError("Product and color mismatch");
        }

        const { data: cartItem } = await this.cartItemRepo.getByKey({
            key: { cartId: cart.id, productId: product.id, productColorId: color.id },
        });

        if (cartItem === null) {
            return this.cartItemRepo.add({
                entity: {
                    id: this.entityIdGenerator.generate(),
                    cartId: cart.id,
                    productCardId: card.id,
                    productColorId: color.id,
                    productId: product.id,
                    quantity,
                    createdAt: now,
                    updatedAt: now,
                },
            });
        }

        return this.cartItemRepo.adjustQuantity({ id: cartItem.id, delta: quantity });
    }
}

type AddProductToCartInput = {
    userId: string;
    productId: string;
    productColorId: string;
    quantity?: number;
};
