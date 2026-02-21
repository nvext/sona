import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { AddItemToCart } from "~~/server/application/cart/uc/add-product-to-cart";
import type { CartRepo } from "~~/server/domain/cart/repo";
import type { CartItemRepo } from "~~/server/domain/cart-item/repo";
import type { ProductRepo } from "~~/server/domain/product/repo";
import type { ProductCardRepo } from "~~/server/domain/product-card/repo";
import type { ProductColorRepo } from "~~/server/domain/product-color/repo";
import type { EntityIdGenerator } from "~~/server/shared/id";
import type { Cart } from "~~/server/domain/cart/entity";
import type { Product } from "~~/server/domain/product/entity";
import type { ProductCard } from "~~/server/domain/product-card/entity";
import type { ProductColor } from "~~/server/domain/product-color/entity";
import type { CartItem } from "~~/server/domain/cart-item/entity";
import { ValidationError } from "~~/server/shared/errors";

const baseCart: Cart = {
    id: "cart-1",
    userId: "user-1",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
};

const baseCard: ProductCard = {
    id: "card-1",
    type: "panel",
    slug: "slug-1",
    title: "Panel",
    description: "desc",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const baseColor: ProductColor = {
    id: "color-1",
    productCardId: baseCard.id,
    name: "Black",
    hex: "#000000",
    imageIds: ["img-1"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const baseProduct: Product = {
    id: "product-1",
    cardId: baseCard.id,
    productColorId: baseColor.id,
    width: 100,
    height: 100,
    thickness: 10,
    price: 1000,
    currency: "RUB",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

class StaticEntityIdGenerator implements EntityIdGenerator {
    generate(): string {
        return "cart-item-1";
    }
}

type BuildOptions = {
    product: Product;
    color: ProductColor;
    existingCartItem: CartItem | null;
    cart: Cart | null;
};

function makeSut(options: BuildOptions) {
    let addCalled = false;
    let adjustDelta: number | null = null;

    let addedCart: Cart | null = null;

    const cartRepo = {
        async getByUserId() {
            return { data: options.cart, meta: undefined };
        },
        async add(input: { entity: Cart }) {
            addedCart = input.entity;
            return { data: input.entity, meta: undefined };
        },
    } as unknown as CartRepo;

    const productRepo = {
        async getById() {
            return { data: options.product, meta: undefined };
        },
    } as unknown as ProductRepo;

    const productColorRepo = {
        async getById() {
            return { data: options.color, meta: undefined };
        },
    } as unknown as ProductColorRepo;

    const productCardRepo = {
        async getById() {
            return { data: baseCard, meta: undefined };
        },
    } as unknown as ProductCardRepo;

    const cartItemRepo = {
        async getByKey() {
            return { data: options.existingCartItem, meta: undefined };
        },
        async add(input: { entity: CartItem }) {
            addCalled = true;
            return { data: input.entity, meta: undefined };
        },
        async adjustQuantity(input: { id: string; delta: number }) {
            adjustDelta = input.delta;
            if (options.existingCartItem === null) {
                return { data: null, meta: undefined };
            }
            return {
                data: {
                    ...options.existingCartItem,
                    quantity: options.existingCartItem.quantity + input.delta,
                },
                meta: undefined,
            };
        },
    } as unknown as CartItemRepo;

    const uc = new AddItemToCart(
        cartRepo,
        cartItemRepo,
        productRepo,
        productCardRepo,
        productColorRepo,
        new StaticEntityIdGenerator(),
    );

    return {
        uc,
        wasAddCalled: () => addCalled,
        getAddedCart: () => addedCart,
        getAdjustDelta: () => adjustDelta,
    };
}

describe("AddItemToCart", () => {
    test("throws ValidationError on product/color mismatch", async () => {
        const mismatchedColor: ProductColor = {
            ...baseColor,
            id: "color-2",
        };

        const { uc, wasAddCalled } = makeSut({
            product: baseProduct,
            color: mismatchedColor,
            existingCartItem: null,
            cart: baseCart,
        });

        await assert.rejects(
            uc.execute({
                userId: "user-1",
                productId: "product-1",
                productColorId: "color-2",
            }),
            (error) =>
                error instanceof ValidationError && error.message === "Product and color mismatch",
        );

        assert.equal(wasAddCalled(), false);
    });

    test("adds cart item when product and color are consistent", async () => {
        const { uc, wasAddCalled } = makeSut({
            product: baseProduct,
            color: baseColor,
            existingCartItem: null,
            cart: baseCart,
        });

        const result = await uc.execute({
            userId: "user-1",
            productId: "product-1",
            productColorId: "color-1",
        });

        assert.ok(result.data);
        assert.equal(result.data.productId, "product-1");
        assert.equal(result.data.productColorId, "color-1");
        assert.equal(result.data.quantity, 1);
        assert.equal(wasAddCalled(), true);
    });

    test("creates cart when missing", async () => {
        const { uc, getAddedCart } = makeSut({
            product: baseProduct,
            color: baseColor,
            existingCartItem: null,
            cart: null,
        });

        const result = await uc.execute({
            userId: "user-1",
            productId: "product-1",
            productColorId: "color-1",
        });

        assert.ok(result.data);
        assert.ok(getAddedCart());
        assert.equal(getAddedCart()?.status, "active");
    });

    test("uses provided quantity when creating new cart item", async () => {
        const { uc } = makeSut({
            product: baseProduct,
            color: baseColor,
            existingCartItem: null,
            cart: baseCart,
        });

        const result = await uc.execute({
            userId: "user-1",
            productId: "product-1",
            productColorId: "color-1",
            quantity: 4,
        });

        assert.ok(result.data);
        assert.equal(result.data.quantity, 4);
    });

    test("adjusts existing cart item by provided quantity", async () => {
        const existingCartItem: CartItem = {
            id: "item-1",
            cartId: baseCart.id,
            productCardId: baseCard.id,
            productColorId: baseColor.id,
            productId: baseProduct.id,
            quantity: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const { uc, getAdjustDelta } = makeSut({
            product: baseProduct,
            color: baseColor,
            existingCartItem,
            cart: baseCart,
        });

        const result = await uc.execute({
            userId: "user-1",
            productId: "product-1",
            productColorId: "color-1",
            quantity: 3,
        });

        assert.ok(result.data);
        assert.equal(result.data.quantity, 5);
        assert.equal(getAdjustDelta(), 3);
    });

    test("throws ValidationError on invalid quantity", async () => {
        const { uc } = makeSut({
            product: baseProduct,
            color: baseColor,
            existingCartItem: null,
            cart: baseCart,
        });

        await assert.rejects(
            uc.execute({
                userId: "user-1",
                productId: "product-1",
                productColorId: "color-1",
                quantity: 0,
            }),
            (error) =>
                error instanceof ValidationError &&
                error.message === "Quantity must be a positive integer",
        );
    });
});
