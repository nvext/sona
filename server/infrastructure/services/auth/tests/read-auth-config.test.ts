import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readAuthConfigFromEnv } from "~~/server/infrastructure/services/auth/read-auth-config";
import { resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";

describe("readAuthConfigFromEnv", () => {
    const originalSessionTtl = process.env.AUTH_SESSION_TTL;
    const originalAccessTtl = process.env.AUTH_ACCESS_TTL;
    const originalSecret = process.env.AUTH_ACCESS_SECRET;

    beforeEach(() => {
        process.env.AUTH_SESSION_TTL = originalSessionTtl;
        process.env.AUTH_ACCESS_TTL = originalAccessTtl;
        process.env.AUTH_ACCESS_SECRET = originalSecret;
        resetRuntimeEnvCacheForTests();
    });

    test("reads custom values", () => {
        process.env.AUTH_SESSION_TTL = "1000";
        process.env.AUTH_ACCESS_TTL = "120000";
        process.env.AUTH_ACCESS_SECRET = "abc";

        const result = readAuthConfigFromEnv();
        assert.equal(result.authConfig.sessionTtl, 1000);
        assert.equal(result.accessTokenConfig.ttlMs, 120000);
        assert.equal(result.accessTokenConfig.secret, "abc");
    });

    test("uses defaults when auth envs are not set", () => {
        delete process.env.AUTH_SESSION_TTL;
        delete process.env.AUTH_ACCESS_TTL;
        delete process.env.AUTH_ACCESS_SECRET;
        resetRuntimeEnvCacheForTests();

        const result = readAuthConfigFromEnv();
        assert.equal(result.authConfig.sessionTtl, 30 * 24 * 60 * 60 * 1000);
        assert.equal(result.accessTokenConfig.ttlMs, 15 * 60 * 1000);
        assert.equal(result.accessTokenConfig.secret, "dev-access-secret-change-me");
    });
});
