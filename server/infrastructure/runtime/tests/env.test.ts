import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readRuntimeEnv, resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";

describe("runtime env", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;
    const originalSecret = process.env.AUTH_ACCESS_SECRET;
    const originalProvider = process.env.ORDER_DELIVERY_PROVIDER;
    const originalBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const originalChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;

    const restoreEnv = () => {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.DATABASE_URL = originalDatabaseUrl;
        process.env.TEST_DATABASE_URL = originalTestDatabaseUrl;
        process.env.AUTH_ACCESS_SECRET = originalSecret;
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
