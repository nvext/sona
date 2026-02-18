import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgProductColorRepo } from "~~/server/infrastructure/db";
import { seedCatalog, setupDbTestHooks } from "./_helpers";

setupDbTestHooks();

describe("PgProductColorRepo", () => {
    test("getByProductCardId", async () => {
        await seedCatalog();

        const productColorRepo = new PgProductColorRepo();
        const colors = await productColorRepo.getByProductCardId({ productCardId: "card-1" });

        assert.equal(colors.data.length, 1);
    });
});
