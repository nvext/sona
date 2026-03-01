import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    readSmsRuPhoneVerificationConfigFromEnv,
    readTelegramPhoneVerificationConfigFromEnv,
} from "~~/server/infrastructure/services/auth/read-phone-verification-config";
import { resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";

describe("read phone verification config", () => {
    test("returns null readers when provider is log", () => {
        const previousProvider = process.env.AUTH_PHONE_VERIFICATION_PROVIDER;
        process.env.AUTH_PHONE_VERIFICATION_PROVIDER = "log";
        resetRuntimeEnvCacheForTests();

        assert.equal(readSmsRuPhoneVerificationConfigFromEnv(), null);
        assert.equal(readTelegramPhoneVerificationConfigFromEnv(), null);

        if (previousProvider === undefined) {
            delete process.env.AUTH_PHONE_VERIFICATION_PROVIDER;
        } else {
            process.env.AUTH_PHONE_VERIFICATION_PROVIDER = previousProvider;
        }
        resetRuntimeEnvCacheForTests();
    });

    test("returns sms.ru config when env is set", () => {
        const previousValues = {
            provider: process.env.AUTH_PHONE_VERIFICATION_PROVIDER,
            apiId: process.env.AUTH_SMS_RU_API_ID,
            from: process.env.AUTH_SMS_RU_FROM,
            testMode: process.env.AUTH_SMS_RU_TEST,
        };

        process.env.AUTH_PHONE_VERIFICATION_PROVIDER = "sms_ru";
        process.env.AUTH_SMS_RU_API_ID = "smsru-api-id";
        process.env.AUTH_SMS_RU_FROM = "Sona";
        process.env.AUTH_SMS_RU_TEST = "true";
        resetRuntimeEnvCacheForTests();

        const config = readSmsRuPhoneVerificationConfigFromEnv();

        process.env.AUTH_PHONE_VERIFICATION_PROVIDER = previousValues.provider;
        process.env.AUTH_SMS_RU_API_ID = previousValues.apiId;
        process.env.AUTH_SMS_RU_FROM = previousValues.from;
        process.env.AUTH_SMS_RU_TEST = previousValues.testMode;
        resetRuntimeEnvCacheForTests();

        assert.deepEqual(config, {
            apiId: "smsru-api-id",
            from: "Sona",
            testMode: true,
        });
    });

    test("returns telegram config when env is set", () => {
        const previousValues = {
            provider: process.env.AUTH_PHONE_VERIFICATION_PROVIDER,
            accessToken: process.env.AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN,
            senderUsername: process.env.AUTH_PHONE_TELEGRAM_GATEWAY_SENDER_USERNAME,
        };

        process.env.AUTH_PHONE_VERIFICATION_PROVIDER = "telegram";
        process.env.AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN = "gateway-token";
        process.env.AUTH_PHONE_TELEGRAM_GATEWAY_SENDER_USERNAME = "sona_codes";
        resetRuntimeEnvCacheForTests();

        const config = readTelegramPhoneVerificationConfigFromEnv();

        process.env.AUTH_PHONE_VERIFICATION_PROVIDER = previousValues.provider;
        process.env.AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN = previousValues.accessToken;
        process.env.AUTH_PHONE_TELEGRAM_GATEWAY_SENDER_USERNAME = previousValues.senderUsername;
        resetRuntimeEnvCacheForTests();

        assert.deepEqual(config, {
            accessToken: "gateway-token",
            senderUsername: "sona_codes",
        });
    });
});
