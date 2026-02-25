import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ConfirmContactVerification } from "~~/server/application/auth/uc/confirm-contact-verification";
import type { User } from "~~/server/domain/user/entity";
import type { UserRepo } from "~~/server/domain/user/repo";
import type { TokenHasher } from "~~/server/shared/hash";
import { ValidationError } from "~~/server/shared/errors";

const baseUser: User = {
    id: "user-1",
    name: "Иван",
    email: "user@example.com",
    phone: "+10000000000",
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    emailVerificationCodeHash: "hash:123456",
    emailVerificationExpiresAt: new Date(Date.now() + 60_000),
    emailVerificationRequestedAt: new Date(),
    phoneVerificationCodeHash: null,
    phoneVerificationExpiresAt: null,
    phoneVerificationRequestedAt: null,
    passwordHash: "hash",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: null,
    sessionVersion: 0,
    status: "active",
};

describe("ConfirmContactVerification", () => {
    test("marks email as verified and clears OTP state", async () => {
        let storedUser: User = { ...baseUser };
        let appliedPatch: Partial<User> | null = null;

        const userRepo = {
            async getById() {
                return { data: storedUser, meta: undefined };
            },
            async update(input: { patch: Partial<User> & { id: string } }) {
                appliedPatch = input.patch;
                storedUser = { ...storedUser, ...input.patch };
                return { data: storedUser, meta: undefined };
            },
        } as unknown as UserRepo;

        const tokenHasher = {
            async verify(hash: string, value: string) {
                return hash === "hash:123456" && value === "123456";
            },
        } as unknown as TokenHasher;

        const uc = new ConfirmContactVerification(userRepo, tokenHasher);
        const result = await uc.execute({
            userId: "user-1",
            channel: "email",
            code: "123456",
        });

        assert.equal(result.channel, "email");
        assert.ok(result.verifiedAt instanceof Date);
        assert.ok(storedUser.emailVerifiedAt instanceof Date);
        assert.equal(storedUser.emailVerificationCodeHash, null);
        assert.equal(storedUser.emailVerificationExpiresAt, null);
        assert.equal(storedUser.emailVerificationRequestedAt, null);
        assert.ok(appliedPatch);
    });

    test("throws ValidationError when code is invalid", async () => {
        const userRepo = {
            async getById() {
                return { data: baseUser, meta: undefined };
            },
        } as unknown as UserRepo;

        const tokenHasher = {
            async verify() {
                return false;
            },
        } as unknown as TokenHasher;

        const uc = new ConfirmContactVerification(userRepo, tokenHasher);

        await assert.rejects(
            uc.execute({
                userId: "user-1",
                channel: "email",
                code: "000000",
            }),
            (error) => error instanceof ValidationError && error.message === "Invalid verification code",
        );
    });

    test("throws ValidationError when code is expired", async () => {
        const userRepo = {
            async getById() {
                return {
                    data: {
                        ...baseUser,
                        emailVerificationExpiresAt: new Date(Date.now() - 1_000),
                    },
                    meta: undefined,
                };
            },
        } as unknown as UserRepo;

        const uc = new ConfirmContactVerification(userRepo, {} as TokenHasher);
        await assert.rejects(
            uc.execute({
                userId: "user-1",
                channel: "email",
                code: "123456",
            }),
            (error) => error instanceof ValidationError && error.message === "Verification code has expired",
        );
    });
});
