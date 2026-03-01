import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ChannelRoutingContactVerificationDeliveryService } from "~~/server/infrastructure/services/auth/ChannelRoutingContactVerificationDeliveryService";

describe("ChannelRoutingContactVerificationDeliveryService", () => {
    test("routes by channel", async () => {
        const delivered: string[] = [];
        const service = new ChannelRoutingContactVerificationDeliveryService({
            email: {
                async send(input) {
                    delivered.push(`email:${input.destination}`);
                },
            },
            phone: {
                async send(input) {
                    delivered.push(`phone:${input.destination}`);
                },
            },
        });

        await service.send({
            userId: "u1",
            channel: "email",
            destination: "user@example.com",
            code: "123456",
            expiresAt: new Date("2026-01-01T00:00:00.000Z"),
        });
        await service.send({
            userId: "u1",
            channel: "phone",
            destination: "+15550001111",
            code: "123456",
            expiresAt: new Date("2026-01-01T00:00:00.000Z"),
        });

        assert.deepEqual(delivered, [
            "email:user@example.com",
            "phone:+15550001111",
        ]);
    });
});
