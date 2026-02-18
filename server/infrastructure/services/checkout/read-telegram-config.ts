export type TelegramDeliveryConfig = {
    botToken: string;
    managerChatId: string;
};

export function readTelegramDeliveryConfigFromEnv(): TelegramDeliveryConfig | null {
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
    const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID?.trim() ?? "";

    if (botToken.length === 0 || managerChatId.length === 0) {
        return null;
    }

    return {
        botToken,
        managerChatId,
    };
}
