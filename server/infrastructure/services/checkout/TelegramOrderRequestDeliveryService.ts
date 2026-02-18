import { OrderRequestDeliveryService } from "~~/server/application/checkout/services/order-request-delivery";
import { TelegramDeliveryConfig } from "./read-telegram-config";

export class TelegramOrderRequestDeliveryService implements OrderRequestDeliveryService {
    constructor(private readonly config: TelegramDeliveryConfig) {}

    async send(input: Parameters<OrderRequestDeliveryService["send"]>[0]): Promise<void> {
        const { orderRequest } = input;
        const message = [
            "New order request submitted",
            `Order ID: ${orderRequest.id}`,
            `User ID: ${orderRequest.userId}`,
            `Contact name: ${orderRequest.contactName ?? "-"}`,
            `Contact phone: ${orderRequest.contactPhone ?? "-"}`,
            `Contact email: ${orderRequest.contactEmail ?? "-"}`,
            `Contact telegram: ${orderRequest.contactTelegram ?? "-"}`,
            `Submitted at: ${orderRequest.submittedAt?.toISOString() ?? "-"}`,
        ].join("\n");

        const response = await fetch(
            `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    chat_id: this.config.managerChatId,
                    text: message,
                }),
            },
        );

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
        }
    }
}
