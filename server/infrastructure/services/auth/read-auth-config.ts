import { AuthConfig } from "~~/server/application/auth/config/AuthConfig";

export type AccessTokenConfig = {
    secret: string;
    ttlMs: number;
};

export function readAuthConfigFromEnv(): { authConfig: AuthConfig; accessTokenConfig: AccessTokenConfig } {
    const sessionTtl = Number(process.env.AUTH_SESSION_TTL ?? 30 * 24 * 60 * 60 * 1000);
    const accessTokenTtlMs = Number(process.env.AUTH_ACCESS_TTL ?? 15 * 60 * 1000);
    const accessTokenSecret = process.env.AUTH_ACCESS_SECRET ?? "dev-access-secret-change-me";

    return {
        authConfig: { sessionTtl },
        accessTokenConfig: {
            secret: accessTokenSecret,
            ttlMs: accessTokenTtlMs,
        },
    };
}
