import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { NoopOrderRequestDeliveryService } from "~~/server/infrastructure/services/checkout/NoopOrderRequestDeliveryService";

describe("NoopOrderRequestDeliveryService", () => {
    test("resolves without side effects", async () => {
        const service = new NoopOrderRequestDeliveryService();
        await assert.doesNotReject(service.send({ orderRequestId: "order-1" }));
    });
});
