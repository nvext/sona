import { readRuntimeEnv } from "~~/server/infrastructure/runtime/env";

export type TelegramDeliveryConfig = {
    botToken: string;
    managerChatId: string;
};

export function readTelegramDeliveryConfigFromEnv(): TelegramDeliveryConfig | null {
    const env = readRuntimeEnv();
    if (env.delivery.provider !== "telegram") {
        return null;
    }

    return {
        botToken: env.delivery.telegramBotToken!,
        managerChatId: env.delivery.telegramManagerChatId!,
    };
}
