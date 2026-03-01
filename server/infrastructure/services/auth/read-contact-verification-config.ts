import { readRuntimeEnv } from "~~/server/infrastructure/runtime/env";

export type SmtpContactVerificationConfig = {
    host: string;
    port: number;
    secure: boolean;
    user: string | null;
    password: string | null;
    from: string;
    replyTo: string | null;
};

export function readSmtpContactVerificationConfigFromEnv(): SmtpContactVerificationConfig | null {
    const env = readRuntimeEnv();
    if (env.auth.contactVerification.provider !== "smtp") {
        return null;
    }

    return {
        host: env.auth.contactVerification.smtpHost!,
        port: env.auth.contactVerification.smtpPort!,
        secure: env.auth.contactVerification.smtpSecure,
        user: env.auth.contactVerification.smtpUser,
        password: env.auth.contactVerification.smtpPassword,
        from: env.auth.contactVerification.emailFrom!,
        replyTo: env.auth.contactVerification.emailReplyTo,
    };
}
