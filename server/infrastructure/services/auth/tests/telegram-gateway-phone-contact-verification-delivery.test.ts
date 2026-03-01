import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { TelegramGatewayPhoneContactVerificationDeliveryService } from "~~/server/infrastructure/services/auth/TelegramGatewayPhoneContactVerificationDeliveryService";

describe("TelegramGatewayPhoneContactVerificationDeliveryService", () => {
    test("sends phone verification via telegram gateway api", async () => {
        const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
        const service = new TelegramGatewayPhoneContactVerificationDeliveryService(
            {
                accessToken: "gateway-token",
                senderUsername: "sona_codes",
            },
            async (url, init) => {
                requests.push({ url: String(url), init });
                return new Response(JSON.stringify({
                    ok: true,
                    result: {
                        request_id: "req-1",
                        delivery_status: {
                            status: "sent",
                        },
                    },
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            },
        );

        await service.send({
            userId: "u1",
            channel: "phone",
            destination: "+79990001122",
            code: "123456",
            expiresAt: new Date(Date.now() + 60_000),
        });

        assert.equal(requests.length, 1);
        assert.equal(requests[0].url, "https://gatewayapi.telegram.org/sendVerificationMessage");
        assert.equal(requests[0].init?.method, "POST");
        assert.equal((requests[0].init?.headers as Record<string, string>).Authorization, "Bearer gateway-token");
        const body = JSON.parse(String(requests[0].init?.body));
        assert.equal(body.phone_number, "+79990001122");
        assert.equal(body.code, "123456");
        assert.equal(body.sender_username, "sona_codes");
        assert.ok(body.ttl >= 30);
        assert.ok(body.ttl <= 3600);
    });

    test("throws on telegram gateway api error", async () => {
        const service = new TelegramGatewayPhoneContactVerificationDeliveryService(
            {
                accessToken: "gateway-token",
                senderUsername: null,
            },
            async () => new Response(JSON.stringify({
                ok: false,
                error: "ACCESS_TOKEN_INVALID",
            }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            }),
        );

        await assert.rejects(() => service.send({
            userId: "u1",
            channel: "phone",
            destination: "+79990001122",
            code: "123456",
            expiresAt: new Date(Date.now() + 60_000),
        }), /ACCESS_TOKEN_INVALID/);
    });
});
