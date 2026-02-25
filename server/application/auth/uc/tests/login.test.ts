import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { InvalidCredentialsError } from "~~/server/shared/errors/InvalidCredentialsError";
import { ContactNotVerifiedError } from "~~/server/shared/errors/ContactNotVerifiedError";
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

    test("rejects login by email when email is not verified", async () => {
        const { uc, sessionRepo } = makeLoginSut({
            user: {
                ...baseUser,
                status: "active",
                emailVerifiedAt: null,
            },
            verifyResult: true,
        });

        await assert.rejects(
            uc.execute({ email: "user@example.com", password: "secret" }),
            ContactNotVerifiedError,
        );
        assert.equal(sessionRepo.added.length, 0);
    });

    test("rejects login by phone when phone is not verified", async () => {
        const { uc, sessionRepo } = makeLoginSut({
            user: {
                ...baseUser,
                status: "active",
                phone: "+10000000000",
                phoneVerifiedAt: null,
            },
            verifyResult: true,
        });

        await assert.rejects(
            uc.execute({ phone: "+10000000000", password: "secret" }),
            ContactNotVerifiedError,
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
