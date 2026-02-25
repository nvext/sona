import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { LogContactVerificationDeliveryService } from "~~/server/infrastructure/services/auth/LogContactVerificationDeliveryService";

describe("LogContactVerificationDeliveryService", () => {
    test("sends without throwing", async () => {
        const service = new LogContactVerificationDeliveryService();

        await assert.doesNotReject(async () => {
            await service.send({
                userId: "u1",
                channel: "email",
                destination: "user@example.com",
                code: "123456",
                expiresAt: new Date("2026-01-01T00:00:00.000Z"),
            });
        });
    });
});
