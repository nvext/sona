import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { CryptoRefreshTokenGenerator } from "~~/server/infrastructure/services/token/CryptoRefreshTokenGenerator";
import { HmacAccessTokenIssuer } from "~~/server/infrastructure/services/token/HmacAccessTokenIssuer";
import { HmacAccessTokenVerifier } from "~~/server/infrastructure/services/token/HmacAccessTokenVerifier";

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

    test("HmacAccessTokenVerifier validates token claims", () => {
        const issuer = new HmacAccessTokenIssuer({
            secret: "test-secret",
            ttlMs: 60_000,
        });
        const verifier = new HmacAccessTokenVerifier({ secret: "test-secret" });

        const token = issuer.issue({
            userId: "user-1",
            sessionId: "session-1",
            sessionVersion: 2,
        });

        const claims = verifier.verify(token);
        assert.ok(claims);
        assert.equal(claims.userId, "user-1");
        assert.equal(claims.sessionId, "session-1");
        assert.equal(claims.sessionVersion, 2);
    });

    test("HmacAccessTokenVerifier rejects invalid signature", () => {
        const issuer = new HmacAccessTokenIssuer({
            secret: "test-secret",
            ttlMs: 60_000,
        });
        const verifier = new HmacAccessTokenVerifier({ secret: "wrong-secret" });

        const token = issuer.issue({
            userId: "user-1",
            sessionId: "session-1",
            sessionVersion: 2,
        });

        const claims = verifier.verify(token);
        assert.equal(claims, null);
    });
});
