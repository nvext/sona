import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { processFailedOrderRequestsOnce } from "~~/server/infrastructure/runtime/order-request-delivery-retry";
import type { RuntimeContainer } from "~~/server/infrastructure/runtime/container";

function makeContainer(options: {
    failedIds: string[];
    shouldFailDelivery?: boolean;
}): { container: RuntimeContainer; updates: Array<Record<string, unknown>> } {
    const updates: Array<Record<string, unknown>> = [];

    const failedRequests = options.failedIds.map((id) => ({
        id,
        userId: "user-1",
        idempotencyKey: `idem-${id}`,
        status: "failed" as const,
        contactName: null,
        contactPhone: null,
        contactEmail: null,
        contactTelegram: null,
        createdAt: new Date(),
        submittedAt: new Date(),
        sentAt: null,
        deliveryAttempts: 0,
        nextDeliveryRetryAt: null,
        lastDeliveryError: null,
        updatedAt: new Date(),
    }));

    const container = {
        repos: {
            orderRequestRepo: {
                async getFailedForDelivery() {
                    return { data: failedRequests, meta: undefined };
                },
                async update(input: { patch: Record<string, unknown> }) {
                    updates.push(input.patch);
                    return { data: null, meta: undefined };
                },
            },
            productSnapshotRepo: {
                async getByOrderRequestId() {
                    return { data: [], meta: undefined };
                },
            },
        },
        services: {
            orderRequestDeliveryService: {
                async send() {
                    if (options.shouldFailDelivery) {
                        throw new Error("delivery failed");
                    }
                },
            },
        },
    } as unknown as RuntimeContainer;

    return { container, updates };
}

describe("order request delivery retry worker", () => {
    test("marks failed requests as sent on successful delivery", async () => {
        const { container, updates } = makeContainer({
            failedIds: ["order-1", "order-2"],
        });

        await processFailedOrderRequestsOnce(container, {
            intervalMs: 1_000,
            batchSize: 20,
            maxAttempts: 3,
            baseDelayMs: 1_000,
            maxDelayMs: 60_000,
        });

        assert.equal(updates.length, 2);
        assert.equal(updates[0].status, "sent");
        assert.equal(updates[1].status, "sent");
    });

    test("keeps status failed when delivery fails", async () => {
        const { container, updates } = makeContainer({
            failedIds: ["order-1"],
            shouldFailDelivery: true,
        });

        await processFailedOrderRequestsOnce(container, {
            intervalMs: 1_000,
            batchSize: 20,
            maxAttempts: 3,
            baseDelayMs: 1_000,
            maxDelayMs: 60_000,
        });

        assert.equal(updates.length, 1);
        assert.equal(updates[0].status, "failed");
        assert.equal(updates[0].deliveryAttempts, 1);
        assert.ok(updates[0].nextDeliveryRetryAt instanceof Date);
    });
});
