import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { CryptoRefreshTokenGenerator } from "~~/server/infrastructure/services/token/CryptoRefreshTokenGenerator";
import { HmacAccessTokenIssuer } from "~~/server/infrastructure/services/token/HmacAccessTokenIssuer";

describe("token services", () => {
    test("CryptoRefreshTokenGenerator generates random tokens", () => {
        const generator = new CryptoRefreshTokenGenerator();
        const first = generator.generate();
        const second = generator.generate();

        assert.ok(first.length > 0);
        assert.ok(second.length > 0);
        assert.notEqual(first, second);
    });

    test("HmacAccessTokenIssuer issues signed token", () => {
        const issuer = new HmacAccessTokenIssuer({
            secret: "test-secret",
            ttlMs: 60_000,
        });

        const token = issuer.issue({
            userId: "user-1",
            sessionId: "session-1",
            sessionVersion: 2,
        });

        const parts = token.split(".");
        assert.equal(parts.length, 2);
        assert.ok(parts[0].length > 0);
        assert.ok(parts[1].length > 0);
    });
});
