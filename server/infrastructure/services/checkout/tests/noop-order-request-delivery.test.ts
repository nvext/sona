import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { NoopOrderRequestDeliveryService } from "~~/server/infrastructure/services/checkout/NoopOrderRequestDeliveryService";
import { OrderRequest } from "~~/server/domain/order-request/entity";

const orderRequest: OrderRequest = {
    id: "order-1",
    userId: "user-1",
    idempotencyKey: "idem-1",
    status: "submitted",
    contactName: "John",
    contactPhone: "+100",
    contactEmail: "john@example.com",
    contactTelegram: "@john",
    createdAt: new Date(),
    submittedAt: new Date(),
    sentAt: null,
    deliveryAttempts: 0,
    nextDeliveryRetryAt: null,
    lastDeliveryError: null,
    updatedAt: new Date(),
};

describe("NoopOrderRequestDeliveryService", () => {
    test("resolves without side effects", async () => {
        const service = new NoopOrderRequestDeliveryService();
        await assert.doesNotReject(service.send({ orderRequest }));
    });
});
