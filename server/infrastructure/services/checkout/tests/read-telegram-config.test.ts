import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readTelegramDeliveryConfigFromEnv } from "~~/server/infrastructure/services/checkout/read-telegram-config";
import { resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";

describe("readTelegramDeliveryConfigFromEnv", () => {
    test("returns null when delivery provider is noop", () => {
        const previousProvider = process.env.ORDER_DELIVERY_PROVIDER;
        process.env.ORDER_DELIVERY_PROVIDER = "noop";
        resetRuntimeEnvCacheForTests();

        const config = readTelegramDeliveryConfigFromEnv();

        if (previousProvider === undefined) {
            delete process.env.ORDER_DELIVERY_PROVIDER;
        } else {
            process.env.ORDER_DELIVERY_PROVIDER = previousProvider;
        }
        resetRuntimeEnvCacheForTests();

        assert.equal(config, null);
    });

    test("throws when provider is telegram and env is incomplete", () => {
        const previousToken = process.env.TELEGRAM_BOT_TOKEN;
        const previousChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
        const previousProvider = process.env.ORDER_DELIVERY_PROVIDER;
        process.env.ORDER_DELIVERY_PROVIDER = "telegram";
        process.env.TELEGRAM_BOT_TOKEN = "";
        process.env.TELEGRAM_MANAGER_CHAT_ID = "123";
        resetRuntimeEnvCacheForTests();

        assert.throws(() => readTelegramDeliveryConfigFromEnv());

        if (previousToken === undefined) {
            delete process.env.TELEGRAM_BOT_TOKEN;
        } else {
            process.env.TELEGRAM_BOT_TOKEN = previousToken;
        }
        if (previousChatId === undefined) {
            delete process.env.TELEGRAM_MANAGER_CHAT_ID;
        } else {
            process.env.TELEGRAM_MANAGER_CHAT_ID = previousChatId;
        }
        if (previousProvider === undefined) {
            delete process.env.ORDER_DELIVERY_PROVIDER;
        } else {
            process.env.ORDER_DELIVERY_PROVIDER = previousProvider;
        }
        resetRuntimeEnvCacheForTests();

    });

    test("returns config when env is set", () => {
        const previousToken = process.env.TELEGRAM_BOT_TOKEN;
        const previousChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
        const previousProvider = process.env.ORDER_DELIVERY_PROVIDER;
        process.env.ORDER_DELIVERY_PROVIDER = "telegram";
        process.env.TELEGRAM_BOT_TOKEN = "bot-token";
        process.env.TELEGRAM_MANAGER_CHAT_ID = "123";
        resetRuntimeEnvCacheForTests();

        const config = readTelegramDeliveryConfigFromEnv();

        if (previousToken === undefined) {
            delete process.env.TELEGRAM_BOT_TOKEN;
        } else {
            process.env.TELEGRAM_BOT_TOKEN = previousToken;
        }
        if (previousChatId === undefined) {
            delete process.env.TELEGRAM_MANAGER_CHAT_ID;
        } else {
            process.env.TELEGRAM_MANAGER_CHAT_ID = previousChatId;
        }
        if (previousProvider === undefined) {
            delete process.env.ORDER_DELIVERY_PROVIDER;
        } else {
            process.env.ORDER_DELIVERY_PROVIDER = previousProvider;
        }
        resetRuntimeEnvCacheForTests();

        assert.deepEqual(config, {
            botToken: "bot-token",
            managerChatId: "123",
        });
    });
});
