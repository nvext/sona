import { AuthConfig } from "~~/server/application/auth/config/AuthConfig";
import { readRuntimeEnv } from "~~/server/infrastructure/runtime/env";

export type AccessTokenConfig = {
    secret: string;
    ttlMs: number;
};

export function readAuthConfigFromEnv(): { authConfig: AuthConfig; accessTokenConfig: AccessTokenConfig } {
    const env = readRuntimeEnv();

    return {
        authConfig: { sessionTtl: env.auth.sessionTtl },
        accessTokenConfig: {
            secret: env.auth.accessSecret,
            ttlMs: env.auth.accessTtlMs,
        },
    };
}
