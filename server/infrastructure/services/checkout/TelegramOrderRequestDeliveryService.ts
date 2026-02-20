import { OrderRequestDeliveryService } from "~~/server/application/checkout/services/order-request-delivery";
import { TelegramDeliveryConfig } from "./read-telegram-config";

export class TelegramOrderRequestDeliveryService implements OrderRequestDeliveryService {
    constructor(private readonly config: TelegramDeliveryConfig) {}

    async send(input: Parameters<OrderRequestDeliveryService["send"]>[0]): Promise<void> {
        const { orderRequest, snapshots } = input;
        const totalPrice = snapshots.reduce(
            (sum, snapshot) => sum + snapshot.price * snapshot.quantity,
            0,
        );
        const totalUnits = snapshots.reduce((sum, snapshot) => sum + snapshot.quantity, 0);
        const currency = snapshots[0]?.currency ?? "RUB";
        const submittedAt = orderRequest.submittedAt
            ? orderRequest.submittedAt.toISOString()
            : "не указано";

        const header = [
            "Новая заявка",
            "",
            "Общая информация:",
            `- ID заявки: ${orderRequest.id}`,
            `- ID пользователя: ${orderRequest.userId}`,
            `- Статус: ${orderRequest.status}`,
            `- Время отправки: ${submittedAt}`,
            "",
            "Контакты клиента:",
            `- Имя: ${orderRequest.contactName ?? "не указано"}`,
            `- Телефон: ${orderRequest.contactPhone ?? "не указано"}`,
            `- Email: ${orderRequest.contactEmail ?? "не указано"}`,
            `- Telegram: ${orderRequest.contactTelegram ?? "не указано"}`,
            "",
            "Состав заявки:",
        ];

        const lines =
            snapshots.length === 0
                ? ["- Позиции не найдены"]
                : snapshots.flatMap((snapshot, index) => {
                      const imageLinks =
                          snapshot.imageIds.length === 0
                              ? "нет"
                              : snapshot.imageIds.join(", ");

                      return [
                          `${index + 1}. ${snapshot.title}`,
                          `   - Описание: ${snapshot.description}`,
                          `   - Размер: ${snapshot.width}x${snapshot.height} мм, толщина ${snapshot.thickness} мм`,
                          `   - Цвет: ${snapshot.colorName} (${snapshot.colorHex})`,
                          `   - ID товара: ${snapshot.productId}`,
                          `   - ID цвета: ${snapshot.colorId}`,
                          `   - Количество: ${snapshot.quantity} шт.`,
                          `   - Цена за шт.: ${snapshot.price} ${snapshot.currency}`,
                          `   - Сумма по позиции: ${snapshot.price * snapshot.quantity} ${snapshot.currency}`,
                          `   - Изображения: ${imageLinks}`,
                      ];
                  });

        const footer = [
            "",
            "Итого:",
            `- Позиции (уникальные): ${snapshots.length}`,
            `- Единиц товара: ${totalUnits}`,
            `- Сумма: ${totalPrice} ${currency}`,
        ];

        const message = [...header, ...lines, ...footer].join("\n");

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
                    disable_web_page_preview: true,
                }),
            },
        );

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
        }
    }
}
