import type { AuthConfig } from "~~/server/application/auth/config/AuthConfig";
import { readRuntimeEnv } from "~~/server/infrastructure/runtime/env";

export type AccessTokenConfig = {
    secret: string;
    ttlMs: number;
};

export function readAuthConfigFromEnv(): { authConfig: AuthConfig; accessTokenConfig: AccessTokenConfig } {
    const env = readRuntimeEnv();

    return {
        authConfig: {
            sessionTtl: env.auth.sessionTtl,
            verificationCodeTtlMs: env.auth.verificationCodeTtlMs,
            verificationResendCooldownMs: env.auth.verificationResendCooldownMs,
        },
        accessTokenConfig: {
            secret: env.auth.accessSecret,
            ttlMs: env.auth.accessTtlMs,
        },
    };
}
