import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { InvalidCredentialsError } from "~~/server/shared/errors/InvalidCredentialsError";
import { baseUser, makeLoginSut } from "~~/server/tests/mocks/auth";

describe("Login", () => {
    test("returns tokens and creates session for active user with valid password", async () => {
        const { uc, sessionRepo, passwordHasher } = makeLoginSut({
            user: { ...baseUser, status: "active" },
            verifyResult: true,
        });

        const result = await uc.execute({ email: "user@example.com", password: "secret" });

        assert.deepEqual(result, {
            accessToken: "access-token",
            refreshToken: "refresh-token",
        });
        assert.equal(passwordHasher.verifyCalls.length, 1);
        assert.equal(sessionRepo.added.length, 1);
    });

    test("rejects blocked user before password verification", async () => {
        const { uc, passwordHasher } = makeLoginSut({
            user: { ...baseUser, status: "blocked" },
            verifyResult: true,
        });

        await assert.rejects(
            uc.execute({ email: "user@example.com", password: "secret" }),
            InvalidCredentialsError,
        );
        assert.equal(passwordHasher.verifyCalls.length, 0);
    });

    test("rejects deleted user before password verification", async () => {
        const { uc, passwordHasher } = makeLoginSut({
            user: { ...baseUser, status: "deleted" },
            verifyResult: true,
        });

        await assert.rejects(
            uc.execute({ email: "user@example.com", password: "secret" }),
            InvalidCredentialsError,
        );
        assert.equal(passwordHasher.verifyCalls.length, 0);
    });

    test("rejects when password is invalid", async () => {
        const { uc, sessionRepo } = makeLoginSut({
            user: { ...baseUser, status: "active" },
            verifyResult: false,
        });

        await assert.rejects(
            uc.execute({ email: "user@example.com", password: "wrong" }),
            InvalidCredentialsError,
        );
        assert.equal(sessionRepo.added.length, 0);
    });

    test("rejects when user is not found", async () => {
        const { uc, passwordHasher } = makeLoginSut({
            user: null,
            verifyResult: true,
        });

        await assert.rejects(
            uc.execute({ email: "user@example.com", password: "secret" }),
            InvalidCredentialsError,
        );
        assert.equal(passwordHasher.verifyCalls.length, 0);
    });
});
