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

    test("getFailedForDelivery returns only failed requests", async () => {
        await seedUser();
        const orderRequestRepo = new PgOrderRequestRepo();

        await orderRequestRepo.add({
            entity: {
                id: "order-failed-1",
                userId: "user-1",
                idempotencyKey: "idem-failed-1",
                status: "failed",
                contactName: null,
                contactPhone: null,
                contactEmail: null,
                contactTelegram: null,
                createdAt: FIXED_NOW,
                submittedAt: FIXED_NOW,
                sentAt: null,
                deliveryAttempts: 0,
                nextDeliveryRetryAt: FIXED_NOW,
                lastDeliveryError: "failed",
                updatedAt: new Date(FIXED_NOW.getTime() - 1000),
            },
        });
        await orderRequestRepo.add({
            entity: {
                id: "order-sent-1",
                userId: "user-1",
                idempotencyKey: "idem-sent-1",
                status: "sent",
                contactName: null,
                contactPhone: null,
                contactEmail: null,
                contactTelegram: null,
                createdAt: FIXED_NOW,
                submittedAt: FIXED_NOW,
                sentAt: FIXED_NOW,
                deliveryAttempts: 0,
                nextDeliveryRetryAt: null,
                lastDeliveryError: null,
                updatedAt: FIXED_NOW,
            },
        });

        const failed = await orderRequestRepo.getFailedForDelivery({
            limit: 10,
            now: new Date(FIXED_NOW.getTime() + 1),
            maxAttempts: 5,
        });
        assert.equal(failed.data.length, 1);
        assert.equal(failed.data[0].id, "order-failed-1");
    });
});
