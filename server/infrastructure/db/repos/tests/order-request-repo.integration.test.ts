import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgOrderRequestRepo } from "~~/server/infrastructure/db";
import { FIXED_NOW, seedUser, setupDbTestHooks } from "./_helpers";

setupDbTestHooks();

describe("PgOrderRequestRepo", () => {
    test("upsertDraft/getDraftByUserId", async () => {
        await seedUser();
        const orderRequestRepo = new PgOrderRequestRepo();

        const upsertedDraft = await orderRequestRepo.upsertDraft({
            entity: {
                id: "order-1",
                userId: "user-1",
                idempotencyKey: "idem-1",
                createdAt: FIXED_NOW,
                updatedAt: FIXED_NOW,
            },
        });
        assert.equal(upsertedDraft.data.status, "draft");

        const draft = await orderRequestRepo.getDraftByUserId({ userId: "user-1" });
        assert.equal(draft.data?.id, upsertedDraft.data.id);
    });
});
