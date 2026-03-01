import type {
    ContactVerificationDeliveryService,
    SendContactVerificationInput,
} from "~~/server/application/auth/services/contact-verification-delivery";
import { logInfo } from "~~/server/infrastructure/runtime";
import type { SmsRuPhoneVerificationConfig } from "./read-phone-verification-config";

type FetchLike = typeof fetch;

type SmsRuResponse = {
    status?: string;
    status_code?: number;
    status_text?: string;
    sms?: Record<string, {
        status?: string;
        status_code?: number;
        status_text?: string;
        sms_id?: string;
    }>;
    balance?: number;
};

export class SmsRuPhoneContactVerificationDeliveryService implements ContactVerificationDeliveryService {
    constructor(
        private readonly config: SmsRuPhoneVerificationConfig,
        private readonly fetchImpl: FetchLike = fetch,
    ) {}

    async send(input: SendContactVerificationInput): Promise<void> {
        if (input.channel !== "phone") {
            throw new Error(`Unsupported contact verification channel: ${input.channel}`);
        }

        const body = new URLSearchParams({
            api_id: this.config.apiId,
            to: input.destination,
            msg: buildSmsBody(input),
            json: "1",
        });

        if (this.config.from) {
            body.set("from", this.config.from);
        }

        if (this.config.testMode) {
            body.set("test", "1");
        }

        const response = await this.fetchImpl("https://sms.ru/sms/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });

        const payload = await safeParseJson(response);
        const messageResult = payload.sms?.[input.destination];
        if (!response.ok || payload.status !== "OK" || messageResult?.status !== "OK") {
            throw new Error(
                messageResult?.status_text ??
                payload.status_text ??
                `sms.ru request failed with status ${response.status}`,
            );
        }

        logInfo("auth.verification.sms_sent", {
            userId: input.userId,
            destination: input.destination,
            expiresAt: input.expiresAt,
            provider: "sms_ru",
            smsId: messageResult.sms_id ?? null,
            balance: payload.balance ?? null,
        });
    }
}

function buildSmsBody(input: SendContactVerificationInput): string {
    return `Kod Sona: ${input.code}. Deystvitelen do ${input.expiresAt.toISOString()}`;
}

async function safeParseJson(response: Response): Promise<SmsRuResponse> {
    try {
        return await response.json() as SmsRuResponse;
    } catch {
        return {};
    }
}
