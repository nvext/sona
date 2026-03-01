import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SmtpContactVerificationDeliveryService } from "~~/server/infrastructure/services/auth/SmtpContactVerificationDeliveryService";

describe("SmtpContactVerificationDeliveryService", () => {
    test("sends email verification via smtp transport", async () => {
        const sentMessages: Array<Record<string, unknown>> = [];
        const service = new SmtpContactVerificationDeliveryService(
            {
                host: "smtp.example.com",
                port: 587,
                secure: false,
                user: "mailer",
                password: "secret",
                from: "Sona <noreply@example.com>",
                replyTo: "support@example.com",
            },
            {
                async sendMail(message) {
                    sentMessages.push(message as Record<string, unknown>);
                },
            },
        );

        await service.send({
            userId: "u1",
            channel: "email",
            destination: "user@example.com",
            code: "123456",
            expiresAt: new Date("2026-01-01T00:00:00.000Z"),
        });

        assert.equal(sentMessages.length, 1);
        assert.equal(sentMessages[0].to, "user@example.com");
        assert.equal(sentMessages[0].from, "Sona <noreply@example.com>");
        assert.equal(sentMessages[0].replyTo, "support@example.com");
        assert.equal(sentMessages[0].subject, "Sona: код подтверждения email");
        assert.match(String(sentMessages[0].text), /123456/);
    });

    test("rejects non-email channels", async () => {
        const service = new SmtpContactVerificationDeliveryService(
            {
                host: "smtp.example.com",
                port: 587,
                secure: false,
                user: null,
                password: null,
                from: "Sona <noreply@example.com>",
                replyTo: null,
            },
            {
                async sendMail() {
                    throw new Error("sendMail should not be called for phone");
                },
            },
        );

        await assert.rejects(() => service.send({
            userId: "u1",
            channel: "phone",
            destination: "+79990000000",
            code: "123456",
            expiresAt: new Date("2026-01-01T00:00:00.000Z"),
        }), /Unsupported contact verification channel/);
    });
});
