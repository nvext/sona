import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readAuthConfigFromEnv } from "~~/server/infrastructure/services/auth/read-auth-config";
import { resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";

describe("readAuthConfigFromEnv", () => {
    const originalSessionTtl = process.env.AUTH_SESSION_TTL;
    const originalAccessTtl = process.env.AUTH_ACCESS_TTL;
    const originalSecret = process.env.AUTH_ACCESS_SECRET;
    const originalVerificationCodeTtl = process.env.AUTH_VERIFICATION_CODE_TTL;
    const originalVerificationResendCooldown = process.env.AUTH_VERIFICATION_RESEND_COOLDOWN;

    beforeEach(() => {
        process.env.AUTH_SESSION_TTL = originalSessionTtl;
        process.env.AUTH_ACCESS_TTL = originalAccessTtl;
        process.env.AUTH_ACCESS_SECRET = originalSecret;
        process.env.AUTH_VERIFICATION_CODE_TTL = originalVerificationCodeTtl;
        process.env.AUTH_VERIFICATION_RESEND_COOLDOWN = originalVerificationResendCooldown;
        resetRuntimeEnvCacheForTests();
    });

    test("reads custom values", () => {
        process.env.AUTH_SESSION_TTL = "1000";
        process.env.AUTH_ACCESS_TTL = "120000";
        process.env.AUTH_ACCESS_SECRET = "abc";
        process.env.AUTH_VERIFICATION_CODE_TTL = "300000";
        process.env.AUTH_VERIFICATION_RESEND_COOLDOWN = "45000";

        const result = readAuthConfigFromEnv();
        assert.equal(result.authConfig.sessionTtl, 1000);
        assert.equal(result.authConfig.verificationCodeTtlMs, 300000);
        assert.equal(result.authConfig.verificationResendCooldownMs, 45000);
        assert.equal(result.accessTokenConfig.ttlMs, 120000);
        assert.equal(result.accessTokenConfig.secret, "abc");
    });

    test("uses defaults when auth envs are not set", () => {
        delete process.env.AUTH_SESSION_TTL;
        delete process.env.AUTH_ACCESS_TTL;
        delete process.env.AUTH_ACCESS_SECRET;
        delete process.env.AUTH_VERIFICATION_CODE_TTL;
        delete process.env.AUTH_VERIFICATION_RESEND_COOLDOWN;
        resetRuntimeEnvCacheForTests();

        const result = readAuthConfigFromEnv();
        assert.equal(result.authConfig.sessionTtl, 30 * 24 * 60 * 60 * 1000);
        assert.equal(result.authConfig.verificationCodeTtlMs, 10 * 60 * 1000);
        assert.equal(result.authConfig.verificationResendCooldownMs, 60 * 1000);
        assert.equal(result.accessTokenConfig.ttlMs, 15 * 60 * 1000);
        assert.equal(result.accessTokenConfig.secret, "dev-access-secret-change-me");
    });
});
