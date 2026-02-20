import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { TelegramOrderRequestDeliveryService } from "~~/server/infrastructure/services/checkout/TelegramOrderRequestDeliveryService";
import { readTelegramDeliveryConfigFromEnv } from "~~/server/infrastructure/services/checkout/read-telegram-config";
import { resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";

describe("telegram integration smoke", () => {
    test(
        "sends real telegram message",
        { skip: process.env.E2E_TELEGRAM_SMOKE !== "1" },
        async () => {
            const previousProvider = process.env.ORDER_DELIVERY_PROVIDER;
            process.env.ORDER_DELIVERY_PROVIDER = "telegram";
            resetRuntimeEnvCacheForTests();

            try {
                const config = readTelegramDeliveryConfigFromEnv();
                assert.ok(config, "Telegram config is required for smoke test");

                const service = new TelegramOrderRequestDeliveryService(config);
                const suffix = Date.now().toString(36);

                await assert.doesNotReject(
                    service.send({
                        orderRequest: {
                            id: `smoke-${suffix}`,
                            userId: "smoke-user",
                            idempotencyKey: `smoke-idem-${suffix}`,
                            status: "submitted",
                            contactName: "Smoke Test",
                            contactPhone: "+10000000000",
                            contactEmail: "smoke@example.com",
                            contactTelegram: "@smoke",
                            createdAt: new Date(),
                            submittedAt: new Date(),
                            sentAt: null,
                            deliveryAttempts: 0,
                            nextDeliveryRetryAt: null,
                            lastDeliveryError: null,
                            updatedAt: new Date(),
                        },
                        snapshots: [
                            {
                                id: `snapshot-${suffix}`,
                                orderRequestId: `smoke-${suffix}`,
                                productId: "smoke-product",
                                title: "Smoke Panel",
                                description: "Smoke description",
                                colorId: "smoke-color",
                                colorName: "Smoke",
                                colorHex: "#123456",
                                imageIds: ["img-smoke-1"],
                                width: 1000,
                                height: 500,
                                thickness: 30,
                                quantity: 2,
                                price: 1000,
                                currency: "RUB",
                                capturedAt: new Date(),
                            },
                        ],
                    }),
                );
            } finally {
                if (previousProvider === undefined) {
                    delete process.env.ORDER_DELIVERY_PROVIDER;
                } else {
                    process.env.ORDER_DELIVERY_PROVIDER = previousProvider;
                }
                resetRuntimeEnvCacheForTests();
            }
        },
    );
});
