import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readTelegramDeliveryConfigFromEnv } from "~~/server/infrastructure/services/checkout/read-telegram-config";

describe("readTelegramDeliveryConfigFromEnv", () => {
    test("returns null when env is incomplete", () => {
        const previousToken = process.env.TELEGRAM_BOT_TOKEN;
        const previousChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
        process.env.TELEGRAM_BOT_TOKEN = "";
        process.env.TELEGRAM_MANAGER_CHAT_ID = "123";

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

        assert.equal(config, null);
    });

    test("returns config when env is set", () => {
        const previousToken = process.env.TELEGRAM_BOT_TOKEN;
        const previousChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
        process.env.TELEGRAM_BOT_TOKEN = "bot-token";
        process.env.TELEGRAM_MANAGER_CHAT_ID = "123";

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

        assert.deepEqual(config, {
            botToken: "bot-token",
            managerChatId: "123",
        });
    });
});
