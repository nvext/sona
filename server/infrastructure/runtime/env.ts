import { z } from "zod";
import { config as loadEnv } from "dotenv";

loadEnv();

const envSchema = z.object({
    NODE_ENV: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    TEST_DATABASE_URL: z.string().optional(),
    AUTH_SESSION_TTL: z.coerce.number().int().positive().default(30 * 24 * 60 * 60 * 1000),
    AUTH_ACCESS_TTL: z.coerce.number().int().positive().default(15 * 60 * 1000),
    AUTH_ACCESS_SECRET: z.string().min(1).default("dev-access-secret-change-me"),
    AUTH_VERIFICATION_CODE_TTL: z.coerce.number().int().positive().default(10 * 60 * 1000),
    AUTH_VERIFICATION_RESEND_COOLDOWN: z.coerce.number().int().positive().default(60 * 1000),
    AUTH_CONTACT_VERIFICATION_PROVIDER: z.enum(["log", "smtp"]).default("log"),
    AUTH_EMAIL_SMTP_HOST: z.string().optional(),
    AUTH_EMAIL_SMTP_PORT: z.coerce.number().int().positive().optional(),
    AUTH_EMAIL_SMTP_SECURE: z
        .string()
        .optional()
        .transform((value) => value?.trim().toLowerCase() === "true"),
    AUTH_EMAIL_SMTP_USER: z.string().optional(),
    AUTH_EMAIL_SMTP_PASSWORD: z.string().optional(),
    AUTH_EMAIL_FROM: z.string().optional(),
    AUTH_EMAIL_REPLY_TO: z.string().optional(),
    AUTH_PHONE_VERIFICATION_PROVIDER: z.enum(["log", "sms_ru", "telegram"]).default("log"),
    AUTH_SMS_RU_API_ID: z.string().optional(),
    AUTH_SMS_RU_FROM: z.string().optional(),
    AUTH_SMS_RU_TEST: z
        .string()
        .optional()
        .transform((value) => value?.trim().toLowerCase() === "true"),
    AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN: z.string().optional(),
    AUTH_PHONE_TELEGRAM_GATEWAY_SENDER_USERNAME: z.string().optional(),
    ORDER_DELIVERY_PROVIDER: z.enum(["noop", "telegram"]).default("noop"),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_MANAGER_CHAT_ID: z.string().optional(),
    CORS_ALLOWED_ORIGINS: z.string().default(""),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(30),
    RATE_LIMIT_SUBMIT_MAX: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_ADMIN_WRITE_MAX: z.coerce.number().int().positive().default(60),
    ADMIN_UI_ENABLED: z
        .string()
        .optional()
        .default("true")
        .transform((value) => value.trim().toLowerCase() !== "false"),
    ADMIN_WRITE_CSRF_TOKEN: z.string().optional(),
    ORDER_DELIVERY_RETRY_INTERVAL: z.coerce.number().int().positive().default(30_000),
    ORDER_DELIVERY_RETRY_BATCH_SIZE: z.coerce.number().int().positive().default(20),
    ORDER_DELIVERY_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    ORDER_DELIVERY_RETRY_BASE_DELAY: z.coerce.number().int().positive().default(30_000),
    ORDER_DELIVERY_RETRY_MAX_DELAY: z.coerce.number().int().positive().default(3_600_000),
});

export type RuntimeEnv = {
    nodeEnv: string;
    databaseUrl: string;
    auth: {
        sessionTtl: number;
        accessTtlMs: number;
        accessSecret: string;
        verificationCodeTtlMs: number;
        verificationResendCooldownMs: number;
        contactVerification: {
            provider: "log" | "smtp";
            smtpHost: string | null;
            smtpPort: number | null;
            smtpSecure: boolean;
            smtpUser: string | null;
            smtpPassword: string | null;
            emailFrom: string | null;
            emailReplyTo: string | null;
            phone: {
                provider: "log" | "sms_ru" | "telegram";
                smsRuApiId: string | null;
                smsRuFrom: string | null;
                smsRuTestMode: boolean;
                telegramGatewayAccessToken: string | null;
                telegramGatewaySenderUsername: string | null;
            };
        };
    };
    delivery: {
        provider: "noop" | "telegram";
        telegramBotToken: string | null;
        telegramManagerChatId: string | null;
    };
    cors: {
        allowedOrigins: string[];
    };
    rateLimit: {
        windowMs: number;
        authMax: number;
        submitMax: number;
        adminWriteMax: number;
    };
    admin: {
        uiEnabled: boolean;
        writeCsrfToken: string | null;
    };
    retry: {
        intervalMs: number;
        batchSize: number;
        maxAttempts: number;
        baseDelayMs: number;
        maxDelayMs: number;
    };
};

let cachedEnv: RuntimeEnv | null = null;

function isTestRuntime(nodeEnv: string): boolean {
    return (
        nodeEnv === "test" ||
        process.argv.includes("test") ||
        process.argv.some((arg) => arg.includes("bun:test"))
    );
}

export function readRuntimeEnv(): RuntimeEnv {
    if (cachedEnv) {
        return cachedEnv;
    }

    const parsed = envSchema.parse(process.env);
    const nodeEnv = parsed.NODE_ENV ?? "development";
    const runtimeIsTest = isTestRuntime(nodeEnv);
    const mainDatabaseUrl = parsed.DATABASE_URL?.trim() ?? "";
    const testDatabaseUrl = parsed.TEST_DATABASE_URL?.trim() ?? "";
    const databaseUrl = runtimeIsTest
        ? testDatabaseUrl || mainDatabaseUrl
        : mainDatabaseUrl;

    if (!databaseUrl) {
        throw new Error(
            runtimeIsTest
                ? "DATABASE_URL or TEST_DATABASE_URL is required in test runtime"
                : "DATABASE_URL is required",
        );
    }
    const telegramBotToken = parsed.TELEGRAM_BOT_TOKEN?.trim() ?? "";
    const telegramManagerChatId = parsed.TELEGRAM_MANAGER_CHAT_ID?.trim() ?? "";
    const authEmailSmtpHost = parsed.AUTH_EMAIL_SMTP_HOST?.trim() ?? "";
    const authEmailSmtpUser = parsed.AUTH_EMAIL_SMTP_USER?.trim() ?? "";
    const authEmailSmtpPassword = parsed.AUTH_EMAIL_SMTP_PASSWORD ?? "";
    const authEmailFrom = parsed.AUTH_EMAIL_FROM?.trim() ?? "";
    const authEmailReplyTo = parsed.AUTH_EMAIL_REPLY_TO?.trim() ?? "";
    const authSmsRuApiId = parsed.AUTH_SMS_RU_API_ID?.trim() ?? "";
    const authSmsRuFrom = parsed.AUTH_SMS_RU_FROM?.trim() ?? "";
    const authPhoneTelegramGatewayAccessToken = parsed.AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN?.trim() ?? "";
    const authPhoneTelegramGatewaySenderUsername = parsed.AUTH_PHONE_TELEGRAM_GATEWAY_SENDER_USERNAME?.trim() ?? "";

    if (parsed.AUTH_CONTACT_VERIFICATION_PROVIDER === "smtp") {
        if (
            authEmailSmtpHost.length === 0 ||
            parsed.AUTH_EMAIL_SMTP_PORT === undefined ||
            authEmailFrom.length === 0
        ) {
            throw new Error(
                "AUTH_EMAIL_SMTP_HOST, AUTH_EMAIL_SMTP_PORT and AUTH_EMAIL_FROM are required when AUTH_CONTACT_VERIFICATION_PROVIDER=smtp",
            );
        }
    }

    if (parsed.AUTH_PHONE_VERIFICATION_PROVIDER === "sms_ru") {
        if (authSmsRuApiId.length === 0) {
            throw new Error(
                "AUTH_SMS_RU_API_ID is required when AUTH_PHONE_VERIFICATION_PROVIDER=sms_ru",
            );
        }
    }

    if (parsed.AUTH_PHONE_VERIFICATION_PROVIDER === "telegram") {
        if (authPhoneTelegramGatewayAccessToken.length === 0) {
            throw new Error(
                "AUTH_PHONE_TELEGRAM_GATEWAY_ACCESS_TOKEN is required when AUTH_PHONE_VERIFICATION_PROVIDER=telegram",
            );
        }
    }

    if (parsed.ORDER_DELIVERY_PROVIDER === "telegram") {
        if (telegramBotToken.length === 0 || telegramManagerChatId.length === 0) {
            throw new Error(
                "TELEGRAM_BOT_TOKEN and TELEGRAM_MANAGER_CHAT_ID are required when ORDER_DELIVERY_PROVIDER=telegram",
            );
        }
    }

    if (nodeEnv === "production" && parsed.AUTH_ACCESS_SECRET === "dev-access-secret-change-me") {
        throw new Error("AUTH_ACCESS_SECRET must be explicitly configured in production");
    }

    cachedEnv = {
        nodeEnv,
        databaseUrl,
        auth: {
            sessionTtl: parsed.AUTH_SESSION_TTL,
            accessTtlMs: parsed.AUTH_ACCESS_TTL,
            accessSecret: parsed.AUTH_ACCESS_SECRET,
            verificationCodeTtlMs: parsed.AUTH_VERIFICATION_CODE_TTL,
            verificationResendCooldownMs: parsed.AUTH_VERIFICATION_RESEND_COOLDOWN,
            contactVerification: {
                provider: parsed.AUTH_CONTACT_VERIFICATION_PROVIDER,
                smtpHost: authEmailSmtpHost.length > 0 ? authEmailSmtpHost : null,
                smtpPort: parsed.AUTH_EMAIL_SMTP_PORT ?? null,
                smtpSecure: parsed.AUTH_EMAIL_SMTP_SECURE,
                smtpUser: authEmailSmtpUser.length > 0 ? authEmailSmtpUser : null,
                smtpPassword: authEmailSmtpPassword.length > 0 ? authEmailSmtpPassword : null,
                emailFrom: authEmailFrom.length > 0 ? authEmailFrom : null,
                emailReplyTo: authEmailReplyTo.length > 0 ? authEmailReplyTo : null,
                phone: {
                    provider: parsed.AUTH_PHONE_VERIFICATION_PROVIDER,
                    smsRuApiId: authSmsRuApiId.length > 0 ? authSmsRuApiId : null,
                    smsRuFrom: authSmsRuFrom.length > 0 ? authSmsRuFrom : null,
                    smsRuTestMode: parsed.AUTH_SMS_RU_TEST,
                    telegramGatewayAccessToken: authPhoneTelegramGatewayAccessToken.length > 0
                        ? authPhoneTelegramGatewayAccessToken
                        : null,
                    telegramGatewaySenderUsername: authPhoneTelegramGatewaySenderUsername.length > 0
                        ? authPhoneTelegramGatewaySenderUsername
                        : null,
                },
            },
        },
        delivery: {
            provider: parsed.ORDER_DELIVERY_PROVIDER,
            telegramBotToken: telegramBotToken.length > 0 ? telegramBotToken : null,
            telegramManagerChatId: telegramManagerChatId.length > 0 ? telegramManagerChatId : null,
        },
        cors: {
            allowedOrigins: parsed.CORS_ALLOWED_ORIGINS.split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0),
        },
        rateLimit: {
            windowMs: parsed.RATE_LIMIT_WINDOW_MS,
            authMax: parsed.RATE_LIMIT_AUTH_MAX,
            submitMax: parsed.RATE_LIMIT_SUBMIT_MAX,
            adminWriteMax: parsed.RATE_LIMIT_ADMIN_WRITE_MAX,
        },
        admin: {
            uiEnabled: parsed.ADMIN_UI_ENABLED,
            writeCsrfToken: (parsed.ADMIN_WRITE_CSRF_TOKEN?.trim() ?? "").length > 0
                ? parsed.ADMIN_WRITE_CSRF_TOKEN!.trim()
                : null,
        },
        retry: {
            intervalMs: parsed.ORDER_DELIVERY_RETRY_INTERVAL,
            batchSize: parsed.ORDER_DELIVERY_RETRY_BATCH_SIZE,
            maxAttempts: parsed.ORDER_DELIVERY_MAX_ATTEMPTS,
            baseDelayMs: parsed.ORDER_DELIVERY_RETRY_BASE_DELAY,
            maxDelayMs: parsed.ORDER_DELIVERY_RETRY_MAX_DELAY,
        },
    };

    return cachedEnv;
}

export function resetRuntimeEnvCacheForTests(): void {
    cachedEnv = null;
}
