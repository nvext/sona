import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readAuthConfigFromEnv } from "~~/server/infrastructure/services/auth/read-auth-config";

describe("readAuthConfigFromEnv", () => {
    const originalSessionTtl = process.env.AUTH_SESSION_TTL_MS;
    const originalAccessTtl = process.env.AUTH_ACCESS_TTL_SEC;
    const originalSecret = process.env.AUTH_ACCESS_SECRET;

    beforeEach(() => {
        process.env.AUTH_SESSION_TTL_MS = originalSessionTtl;
        process.env.AUTH_ACCESS_TTL_SEC = originalAccessTtl;
        process.env.AUTH_ACCESS_SECRET = originalSecret;
    });

    test("reads custom values", () => {
        process.env.AUTH_SESSION_TTL_MS = "1000";
        process.env.AUTH_ACCESS_TTL_SEC = "120";
        process.env.AUTH_ACCESS_SECRET = "abc";

        const result = readAuthConfigFromEnv();
        assert.equal(result.authConfig.sessionTtl, 1000);
        assert.equal(result.accessTokenConfig.ttlSeconds, 120);
        assert.equal(result.accessTokenConfig.secret, "abc");
    });

    test("uses defaults when envs are not set", () => {
        delete process.env.AUTH_SESSION_TTL_MS;
        delete process.env.AUTH_ACCESS_TTL_SEC;
        delete process.env.AUTH_ACCESS_SECRET;

        const result = readAuthConfigFromEnv();
        assert.equal(result.authConfig.sessionTtl, 30 * 24 * 60 * 60 * 1000);
        assert.equal(result.accessTokenConfig.ttlSeconds, 15 * 60);
        assert.equal(result.accessTokenConfig.secret, "dev-access-secret-change-me");
    });
});
