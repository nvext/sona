import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readSmtpContactVerificationConfigFromEnv } from "~~/server/infrastructure/services/auth/read-contact-verification-config";
import { resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";

describe("readSmtpContactVerificationConfigFromEnv", () => {
    test("returns null when auth contact verification provider is log", () => {
        const previousProvider = process.env.AUTH_CONTACT_VERIFICATION_PROVIDER;
        process.env.AUTH_CONTACT_VERIFICATION_PROVIDER = "log";
        resetRuntimeEnvCacheForTests();

        const config = readSmtpContactVerificationConfigFromEnv();

        if (previousProvider === undefined) {
            delete process.env.AUTH_CONTACT_VERIFICATION_PROVIDER;
        } else {
            process.env.AUTH_CONTACT_VERIFICATION_PROVIDER = previousProvider;
        }
        resetRuntimeEnvCacheForTests();

        assert.equal(config, null);
    });

    test("returns config when smtp env is set", () => {
        const previousValues = {
            provider: process.env.AUTH_CONTACT_VERIFICATION_PROVIDER,
            host: process.env.AUTH_EMAIL_SMTP_HOST,
            port: process.env.AUTH_EMAIL_SMTP_PORT,
            secure: process.env.AUTH_EMAIL_SMTP_SECURE,
            user: process.env.AUTH_EMAIL_SMTP_USER,
            password: process.env.AUTH_EMAIL_SMTP_PASSWORD,
            from: process.env.AUTH_EMAIL_FROM,
            replyTo: process.env.AUTH_EMAIL_REPLY_TO,
        };

        process.env.AUTH_CONTACT_VERIFICATION_PROVIDER = "smtp";
        process.env.AUTH_EMAIL_SMTP_HOST = "smtp.example.com";
        process.env.AUTH_EMAIL_SMTP_PORT = "587";
        process.env.AUTH_EMAIL_SMTP_SECURE = "false";
        process.env.AUTH_EMAIL_SMTP_USER = "mailer";
        process.env.AUTH_EMAIL_SMTP_PASSWORD = "secret";
        process.env.AUTH_EMAIL_FROM = "Sona <noreply@example.com>";
        process.env.AUTH_EMAIL_REPLY_TO = "support@example.com";
        resetRuntimeEnvCacheForTests();

        const config = readSmtpContactVerificationConfigFromEnv();

        process.env.AUTH_CONTACT_VERIFICATION_PROVIDER = previousValues.provider;
        process.env.AUTH_EMAIL_SMTP_HOST = previousValues.host;
        process.env.AUTH_EMAIL_SMTP_PORT = previousValues.port;
        process.env.AUTH_EMAIL_SMTP_SECURE = previousValues.secure;
        process.env.AUTH_EMAIL_SMTP_USER = previousValues.user;
        process.env.AUTH_EMAIL_SMTP_PASSWORD = previousValues.password;
        process.env.AUTH_EMAIL_FROM = previousValues.from;
        process.env.AUTH_EMAIL_REPLY_TO = previousValues.replyTo;
        resetRuntimeEnvCacheForTests();

        assert.deepEqual(config, {
            host: "smtp.example.com",
            port: 587,
            secure: false,
            user: "mailer",
            password: "secret",
            from: "Sona <noreply@example.com>",
            replyTo: "support@example.com",
        });
    });
});
