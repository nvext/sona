import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { TelegramOrderRequestDeliveryService } from "~~/server/infrastructure/services/checkout/TelegramOrderRequestDeliveryService";
import { OrderRequest } from "~~/server/domain/order-request/entity";
import { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";

const orderRequest: OrderRequest = {
    id: "order-1",
    userId: "user-1",
    idempotencyKey: "idem-1",
    status: "submitted",
    contactName: "John",
    contactPhone: "+100",
    contactEmail: "john@example.com",
    contactTelegram: "@john",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    submittedAt: new Date("2026-01-01T01:00:00.000Z"),
    sentAt: null,
    deliveryAttempts: 0,
    nextDeliveryRetryAt: null,
    lastDeliveryError: null,
    updatedAt: new Date("2026-01-01T01:00:00.000Z"),
};
const snapshots: ProductSnapshot[] = [
    {
        id: "snapshot-1",
        orderRequestId: orderRequest.id,
        productId: "product-1",
        title: "Панель A",
        description: "Описание панели",
        colorId: "color-1",
        colorName: "Графит",
        colorHex: "#444444",
        imageIds: ["img-1", "img-2"],
        width: 1200,
        height: 600,
        thickness: 40,
        price: 25000,
        currency: "RUB",
        capturedAt: new Date("2026-01-01T00:30:00.000Z"),
    },
];

describe("TelegramOrderRequestDeliveryService", () => {
    test("sends message via telegram bot api", async () => {
        const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
        const previousFetch = globalThis.fetch;
        globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
            calls.push({ url: String(input), init });
            return new Response("ok", { status: 200 });
        }) as typeof fetch;

        try {
            const service = new TelegramOrderRequestDeliveryService({
                botToken: "bot-token",
                managerChatId: "777",
            });

            await service.send({ orderRequest, snapshots });
        } finally {
            globalThis.fetch = previousFetch;
        }

        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, "https://api.telegram.org/botbot-token/sendMessage");
        assert.equal(calls[0].init?.method, "POST");

        const payload = JSON.parse(String(calls[0].init?.body ?? "{}"));
        assert.equal(payload.chat_id, "777");
        assert.ok(String(payload.text).includes("Новая заявка"));
        assert.ok(String(payload.text).includes("Состав заявки:"));
        assert.ok(String(payload.text).includes("Панель A"));
        assert.ok(String(payload.text).includes("Итого:"));
    });

    test("throws when telegram api returns error", async () => {
        const previousFetch = globalThis.fetch;
        globalThis.fetch = (async () => new Response("bad request", { status: 400 })) as typeof fetch;

        try {
            const service = new TelegramOrderRequestDeliveryService({
                botToken: "bot-token",
                managerChatId: "777",
            });

            await assert.rejects(
                service.send({ orderRequest, snapshots }),
                (error) =>
                    error instanceof Error &&
                    error.message.includes("Telegram sendMessage failed: 400"),
            );
        } finally {
            globalThis.fetch = previousFetch;
        }
    });
});
