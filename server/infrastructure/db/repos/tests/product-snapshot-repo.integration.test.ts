import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgOrderRequestRepo, PgProductSnapshotRepo } from "~~/server/infrastructure/db";
import { FIXED_NOW, seedUser, setupDbTestHooks } from "./helpers";

setupDbTestHooks();

describe("PgProductSnapshotRepo", () => {
    test("add/getById", async () => {
        await seedUser();
        const orderRequestRepo = new PgOrderRequestRepo();
        const productSnapshotRepo = new PgProductSnapshotRepo();

        const upsertedDraft = await orderRequestRepo.upsertDraft({
            entity: {
                id: "order-1",
                userId: "user-1",
                idempotencyKey: "idem-1",
                createdAt: FIXED_NOW,
                updatedAt: FIXED_NOW,
            },
        });

        await productSnapshotRepo.add({
            entity: {
                id: "snapshot-1",
                orderRequestId: upsertedDraft.data.id,
                productId: "product-1",
                title: "Panel",
                description: "desc",
                colorId: "color-1",
                colorName: "Black",
                colorHex: "#000",
                imageIds: ["img-1"],
                width: 100,
                height: 100,
                thickness: 10,
                price: 1000,
                currency: "RUB",
                capturedAt: FIXED_NOW,
            },
        });

        const snapshot = await productSnapshotRepo.getById({ id: "snapshot-1" });
        assert.equal(snapshot.data?.id, "snapshot-1");
    });
});
