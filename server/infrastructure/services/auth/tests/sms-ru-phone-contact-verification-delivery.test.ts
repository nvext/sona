import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SmsRuPhoneContactVerificationDeliveryService } from "~~/server/infrastructure/services/auth/SmsRuPhoneContactVerificationDeliveryService";

describe("SmsRuPhoneContactVerificationDeliveryService", () => {
    test("sends phone verification via sms.ru api", async () => {
        const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
        const service = new SmsRuPhoneContactVerificationDeliveryService(
            {
                apiId: "smsru-api-id",
                from: "Sona",
                testMode: true,
            },
            async (url, init) => {
                requests.push({ url: String(url), init });
                return new Response(JSON.stringify({
                    status: "OK",
                    status_code: 100,
                    sms: {
                        "+79990001122": {
                            status: "OK",
                            status_code: 100,
                            sms_id: "sms-id-1",
                        },
                    },
                    balance: 100,
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
            expiresAt: new Date("2026-01-01T00:00:00.000Z"),
        });

        assert.equal(requests.length, 1);
        assert.equal(requests[0].url, "https://sms.ru/sms/send");
        assert.equal(requests[0].init?.method, "POST");
        const body = String(requests[0].init?.body);
        assert.match(body, /api_id=smsru-api-id/);
        assert.match(body, /to=%2B79990001122/);
        assert.match(body, /from=Sona/);
        assert.match(body, /test=1/);
    });

    test("throws on sms.ru api error", async () => {
        const service = new SmsRuPhoneContactVerificationDeliveryService(
            {
                apiId: "smsru-api-id",
                from: null,
                testMode: false,
            },
            async () => new Response(JSON.stringify({
                status: "ERROR",
                status_code: 201,
                status_text: "Not enough money",
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        await assert.rejects(() => service.send({
            userId: "u1",
            channel: "phone",
            destination: "+79990001122",
            code: "123456",
            expiresAt: new Date("2026-01-01T00:00:00.000Z"),
        }), /Not enough money/);
    });
});
