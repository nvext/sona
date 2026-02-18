import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgCartRepo } from "~~/server/infrastructure/db";
import { seedCart, seedUser, setupDbTestHooks } from "./helpers";

setupDbTestHooks();

describe("PgCartRepo", () => {
    test("getByUserId", async () => {
        await seedUser();
        await seedCart();

        const cartRepo = new PgCartRepo();
        const cartByUser = await cartRepo.getByUserId({ userId: "user-1" });

        assert.equal(cartByUser.data?.id, "cart-1");
    });
});
