import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgProductCardRepo } from "~~/server/infrastructure/db";
import { FIXED_NOW, setupDbTestHooks } from "./_helpers";

setupDbTestHooks();

describe("PgProductCardRepo", () => {
    test("add/getById", async () => {
        const repo = new PgProductCardRepo();

        await repo.add({
            entity: {
                id: "card-1",
                type: "panel",
                slug: "panel-1",
                title: "Panel",
                description: "desc",
                isActive: true,
                createdAt: FIXED_NOW,
                updatedAt: FIXED_NOW,
            },
        });

        const byId = await repo.getById({ id: "card-1" });
        assert.equal(byId.data?.id, "card-1");
    });
});
