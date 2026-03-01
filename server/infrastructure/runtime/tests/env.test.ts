import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readRuntimeEnv, resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";

describe("runtime env", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;
    const originalSecret = process.env.AUTH_ACCESS_SECRET;
    const originalVerificationCodeTtl = process.env.AUTH_VERIFICATION_CODE_TTL;
    const originalVerificationResendCooldown = process.env.AUTH_VERIFICATION_RESEND_COOLDOWN;
    const originalContactVerificationProvider = process.env.AUTH_CONTACT_VERIFICATION_PROVIDER;
    const originalAuthEmailSmtpHost = process.env.AUTH_EMAIL_SMTP_HOST;
    const originalAuthEmailSmtpPort = process.env.AUTH_EMAIL_SMTP_PORT;
    const originalAuthEmailFrom = process.env.AUTH_EMAIL_FROM;
    const originalPhoneVerificationProvider = process.env.AUTH_PHONE_VERIFICATION_PROVIDER;
    const originalSmsRuApiId = process.env.AUTH_SMS_RU_API_ID;
    const originalSmsRuFrom = process.env.AUTH_SMS_RU_FROM;
    const originalSmsRuTest = process.env.AUTH_SMS_RU_TEST;
    const originalPhoneTelegramGatewayAccessToken = process.env.AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN;
    const originalPhoneTelegramGatewaySenderUsername = process.env.AUTH_PHONE_TELEGRAM_GATEWAY_SENDER_USERNAME;
    const originalProvider = process.env.ORDER_DELIVERY_PROVIDER;
    const originalBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const originalChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;

    const restoreEnv = () => {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.DATABASE_URL = originalDatabaseUrl;
        process.env.TEST_DATABASE_URL = originalTestDatabaseUrl;
        process.env.AUTH_ACCESS_SECRET = originalSecret;
        process.env.AUTH_VERIFICATION_CODE_TTL = originalVerificationCodeTtl;
        process.env.AUTH_VERIFICATION_RESEND_COOLDOWN = originalVerificationResendCooldown;
        process.env.AUTH_CONTACT_VERIFICATION_PROVIDER = originalContactVerificationProvider;
        process.env.AUTH_EMAIL_SMTP_HOST = originalAuthEmailSmtpHost;
        process.env.AUTH_EMAIL_SMTP_PORT = originalAuthEmailSmtpPort;
        process.env.AUTH_EMAIL_FROM = originalAuthEmailFrom;
        process.env.AUTH_PHONE_VERIFICATION_PROVIDER = originalPhoneVerificationProvider;
        process.env.AUTH_SMS_RU_API_ID = originalSmsRuApiId;
        process.env.AUTH_SMS_RU_FROM = originalSmsRuFrom;
        process.env.AUTH_SMS_RU_TEST = originalSmsRuTest;
        process.env.AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN = originalPhoneTelegramGatewayAccessToken;
        process.env.AUTH_PHONE_TELEGRAM_GATEWAY_SENDER_USERNAME = originalPhoneTelegramGatewaySenderUsername;
        process.env.ORDER_DELIVERY_PROVIDER = originalProvider;
        process.env.TELEGRAM_BOT_TOKEN = originalBotToken;
        process.env.TELEGRAM_MANAGER_CHAT_ID = originalChatId;
        resetRuntimeEnvCacheForTests();
    };

    beforeEach(restoreEnv);
    afterEach(restoreEnv);

    test("throws in production when default auth secret is used", () => {
        process.env.NODE_ENV = "production";
        process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
        process.env.AUTH_ACCESS_SECRET = "dev-access-secret-change-me";
        resetRuntimeEnvCacheForTests();

        assert.throws(() => readRuntimeEnv(), /AUTH_ACCESS_SECRET/);
    });

    test("throws when telegram provider is configured without token/chat id", () => {
        process.env.NODE_ENV = "development";
        process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
        process.env.ORDER_DELIVERY_PROVIDER = "telegram";
        process.env.TELEGRAM_BOT_TOKEN = "";
        process.env.TELEGRAM_MANAGER_CHAT_ID = "";
        resetRuntimeEnvCacheForTests();

        assert.throws(() => readRuntimeEnv(), /TELEGRAM_BOT_TOKEN/);
    });

    test("throws when smtp auth verification provider is configured without required email env", () => {
        process.env.NODE_ENV = "development";
        process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
        process.env.AUTH_CONTACT_VERIFICATION_PROVIDER = "smtp";
        process.env.AUTH_EMAIL_SMTP_HOST = "";
        process.env.AUTH_EMAIL_SMTP_PORT = "587";
        process.env.AUTH_EMAIL_FROM = "";
        resetRuntimeEnvCacheForTests();

        assert.throws(() => readRuntimeEnv(), /AUTH_EMAIL_SMTP_HOST/);
    });

    test("throws when sms.ru phone verification provider is configured without required env", () => {
        process.env.NODE_ENV = "development";
        process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
        process.env.AUTH_PHONE_VERIFICATION_PROVIDER = "sms_ru";
        process.env.AUTH_SMS_RU_API_ID = "";
        resetRuntimeEnvCacheForTests();

        assert.throws(() => readRuntimeEnv(), /AUTH_SMS_RU_API_ID/);
    });

    test("throws when telegram phone verification provider is configured without required env", () => {
        process.env.NODE_ENV = "development";
        process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
        process.env.AUTH_PHONE_VERIFICATION_PROVIDER = "telegram";
        process.env.AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN = "";
        resetRuntimeEnvCacheForTests();

        assert.throws(() => readRuntimeEnv(), /AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN/);
    });

    test("uses TEST_DATABASE_URL in test runtime", () => {
        process.env.NODE_ENV = "test";
        process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/main_db";
        process.env.TEST_DATABASE_URL = "postgresql://u:p@localhost:5432/test_db";
        process.env.AUTH_ACCESS_SECRET = "secret";
        resetRuntimeEnvCacheForTests();

        const env = readRuntimeEnv();
        assert.equal(env.databaseUrl, "postgresql://u:p@localhost:5432/test_db");
    });
});
