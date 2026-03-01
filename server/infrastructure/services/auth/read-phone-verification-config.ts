import { readRuntimeEnv } from "~~/server/infrastructure/runtime/env";

export type SmsRuPhoneVerificationConfig = {
    apiId: string;
    from: string | null;
    testMode: boolean;
};

export type TelegramGatewayPhoneVerificationConfig = {
    accessToken: string;
    senderUsername: string | null;
};

export function readSmsRuPhoneVerificationConfigFromEnv(): SmsRuPhoneVerificationConfig | null {
    const env = readRuntimeEnv();
    if (env.auth.contactVerification.phone.provider !== "sms_ru") {
        return null;
    }

    return {
        apiId: env.auth.contactVerification.phone.smsRuApiId!,
        from: env.auth.contactVerification.phone.smsRuFrom,
        testMode: env.auth.contactVerification.phone.smsRuTestMode,
    };
}

export function readTelegramPhoneVerificationConfigFromEnv(): TelegramGatewayPhoneVerificationConfig | null {
    const env = readRuntimeEnv();
    if (env.auth.contactVerification.phone.provider !== "telegram") {
        return null;
    }

    return {
        accessToken: env.auth.contactVerification.phone.telegramGatewayAccessToken!,
        senderUsername: env.auth.contactVerification.phone.telegramGatewaySenderUsername,
    };
}
