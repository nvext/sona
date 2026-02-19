import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { RemoveItemFromCart } from "~~/server/application/cart/uc/remove-product-from-cart";
import type { CartItemRepo } from "~~/server/domain/cart-item/repo";
import type { CartItem } from "~~/server/domain/cart-item/entity";
import type { CartRepo } from "~~/server/domain/cart/repo";
import { NotFoundError } from "~~/server/shared/errors";

const baseCartItem: CartItem = {
    id: "item-1",
    cartId: "cart-1",
    productCardId: "card-1",
    productId: "product-1",
    productColorId: "color-1",
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe("RemoveItemFromCart", () => {
    test("decrements item quantity", async () => {
        const adjustCalls: { id: string; delta: number }[] = [];

        const cartItemRepo = {
            async getById() {
                return { data: baseCartItem, meta: undefined };
            },
            async adjustQuantity(input: { id: string; delta: number }) {
                adjustCalls.push(input);
                return { data: { ...baseCartItem, quantity: 1 }, meta: undefined };
            },
        } as unknown as CartItemRepo;
        const cartRepo = {
            async getById() {
                return { data: { id: "cart-1", userId: "user-1" }, meta: undefined };
            },
        } as unknown as CartRepo;

        const uc = new RemoveItemFromCart(cartItemRepo, cartRepo);
        const result = await uc.execute({ itemId: "item-1", userId: "user-1" });

        assert.ok(result.data);
        assert.equal(result.data.quantity, 1);
        assert.equal(adjustCalls.length, 1);
        assert.equal(adjustCalls[0].id, "item-1");
        assert.equal(adjustCalls[0].delta, -1);
    });

    test("deletes item when quantity is 1", async () => {
        let deletedId: string | null = null;

        const cartItemRepo = {
            async getById() {
                return { data: { ...baseCartItem, quantity: 1 }, meta: undefined };
            },
            async delete(input: { id: string }) {
                deletedId = input.id;
                return { data: { ...baseCartItem, quantity: 1 }, meta: undefined };
            },
        } as unknown as CartItemRepo;
        const cartRepo = {
            async getById() {
                return { data: { id: "cart-1", userId: "user-1" }, meta: undefined };
            },
        } as unknown as CartRepo;

        const uc = new RemoveItemFromCart(cartItemRepo, cartRepo);
        const result = await uc.execute({ itemId: "item-1", userId: "user-1" });

        assert.ok(result.data);
        assert.equal(deletedId, "item-1");
    });

    test("throws NotFoundError when item is missing", async () => {
        const cartItemRepo = {
            async getById() {
                return { data: null, meta: undefined };
            },
        } as unknown as CartItemRepo;
        const cartRepo = {} as unknown as CartRepo;

        const uc = new RemoveItemFromCart(cartItemRepo, cartRepo);
        await assert.rejects(
            uc.execute({ itemId: "missing-item", userId: "user-1" }),
            (error) => error instanceof NotFoundError && error.message === "Cart item not found",
        );
    });

    test("throws NotFoundError when item belongs to another user", async () => {
        const cartItemRepo = {
            async getById() {
                return { data: baseCartItem, meta: undefined };
            },
        } as unknown as CartItemRepo;
        const cartRepo = {
            async getById() {
                return { data: { id: "cart-1", userId: "another-user" }, meta: undefined };
            },
        } as unknown as CartRepo;

        const uc = new RemoveItemFromCart(cartItemRepo, cartRepo);
        await assert.rejects(
            uc.execute({ itemId: "item-1", userId: "user-1" }),
            (error) => error instanceof NotFoundError && error.message === "Cart item not found",
        );
    });
});
