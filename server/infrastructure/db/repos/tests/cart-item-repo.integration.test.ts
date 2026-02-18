import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgCartItemRepo } from "~~/server/infrastructure/db";
import { FIXED_NOW, seedCart, seedCatalog, seedUser, setupDbTestHooks } from "./_helpers";

setupDbTestHooks();

describe("PgCartItemRepo", () => {
    test("getByKey/getByCartId/adjustQuantity", async () => {
        await seedUser();
        await seedCart();
        await seedCatalog();

        const cartItemRepo = new PgCartItemRepo();
        await cartItemRepo.add({
            entity: {
                id: "item-1",
                cartId: "cart-1",
                productCardId: "card-1",
                productId: "product-1",
                productColorId: "color-1",
                quantity: 1,
                createdAt: FIXED_NOW,
                updatedAt: FIXED_NOW,
            },
        });

        const byKey = await cartItemRepo.getByKey({
            key: { cartId: "cart-1", productId: "product-1", productColorId: "color-1" },
        });
        assert.equal(byKey.data?.id, "item-1");

        const adjusted = await cartItemRepo.adjustQuantity({ id: "item-1", delta: 2 });
        assert.equal(adjusted.data?.quantity, 3);

        const byCartId = await cartItemRepo.getByCartId({ cartId: "cart-1" });
        assert.equal(byCartId.data.length, 1);
    });
});
