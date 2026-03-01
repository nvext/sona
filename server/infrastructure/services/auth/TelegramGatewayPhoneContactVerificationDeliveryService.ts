import type {
    ContactVerificationDeliveryService,
    SendContactVerificationInput,
} from "~~/server/application/auth/services/contact-verification-delivery";
import { logInfo } from "~~/server/infrastructure/runtime";
import type { TelegramGatewayPhoneVerificationConfig } from "./read-phone-verification-config";

type FetchLike = typeof fetch;

type TelegramGatewayResponse = {
    ok?: boolean;
    error?: string;
    result?: {
        request_id?: string;
        delivery_status?: {
            status?: string;
        };
    };
};

export class TelegramGatewayPhoneContactVerificationDeliveryService implements ContactVerificationDeliveryService {
    constructor(
        private readonly config: TelegramGatewayPhoneVerificationConfig,
        private readonly fetchImpl: FetchLike = fetch,
    ) {}

    async send(input: SendContactVerificationInput): Promise<void> {
        if (input.channel !== "phone") {
            throw new Error(`Unsupported contact verification channel: ${input.channel}`);
        }

        const ttlSeconds = Math.max(
            30,
            Math.min(3600, Math.floor((input.expiresAt.getTime() - Date.now()) / 1000)),
        );

        const response = await this.fetchImpl(
            "https://gatewayapi.telegram.org/sendVerificationMessage",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.config.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phone_number: input.destination,
                    code: input.code,
                    ttl: ttlSeconds,
                    sender_username: this.config.senderUsername ?? undefined,
                }),
            },
        );

        const payload = await safeParseJson(response);
        if (!response.ok || payload.ok !== true) {
            throw new Error(payload.error ?? `Telegram Gateway request failed with status ${response.status}`);
        }

        logInfo("auth.verification.sms_sent", {
            userId: input.userId,
            destination: input.destination,
            expiresAt: input.expiresAt,
            provider: "telegram_gateway",
            requestId: payload.result?.request_id ?? null,
            deliveryStatus: payload.result?.delivery_status?.status ?? null,
        });
    }
}

async function safeParseJson(response: Response): Promise<TelegramGatewayResponse> {
    try {
        return await response.json() as TelegramGatewayResponse;
    } catch {
        return {};
    }
}
