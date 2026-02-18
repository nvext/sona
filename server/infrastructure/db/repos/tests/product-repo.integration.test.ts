import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgProductRepo } from "~~/server/infrastructure/db";
import { seedCatalog, setupDbTestHooks } from "./helpers";

setupDbTestHooks();

describe("PgProductRepo", () => {
    test("getByProductCardId", async () => {
        await seedCatalog();

        const productRepo = new PgProductRepo();
        const products = await productRepo.getByProductCardId({ productCardId: "card-1" });

        assert.equal(products.data.length, 1);
    });
});
