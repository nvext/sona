import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { RequestContactVerification } from "~~/server/application/auth/uc/request-contact-verification";
import type { User } from "~~/server/domain/user/entity";
import type { UserRepo } from "~~/server/domain/user/repo";
import type { TokenHasher } from "~~/server/shared/hash";
import type { VerificationCodeGenerator } from "~~/server/application/auth/services/verification-code-generator";
import type { ContactVerificationDeliveryService } from "~~/server/application/auth/services/contact-verification-delivery";
import { OperationFailedError, ValidationError } from "~~/server/shared/errors";

const baseUser: User = {
    id: "user-1",
    name: "Иван",
    email: "user@example.com",
    phone: "+10000000000",
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    emailVerificationCodeHash: null,
    emailVerificationExpiresAt: null,
    emailVerificationRequestedAt: null,
    phoneVerificationCodeHash: null,
    phoneVerificationExpiresAt: null,
    phoneVerificationRequestedAt: null,
    passwordHash: "hash",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: null,
    sessionVersion: 0,
    status: "active",
};

describe("RequestContactVerification", () => {
    test("stores email code and delegates delivery", async () => {
        let storedUser: User = { ...baseUser };
        const appliedPatches: Array<Record<string, unknown>> = [];
        const sentPayloads: Array<Record<string, unknown>> = [];

        const userRepo = {
            async getById() {
                return { data: storedUser, meta: undefined };
            },
            async update(input: { patch: Partial<User> & { id: string } }) {
                appliedPatches.push(input.patch as Record<string, unknown>);
                storedUser = { ...storedUser, ...input.patch };
                return { data: storedUser, meta: undefined };
            },
        } as unknown as UserRepo;

        const tokenHasher = {
            async hash(value: string) {
                return `hash:${value}`;
            },
        } as unknown as TokenHasher;

        const codeGenerator = {
            generate() {
                return "123456";
            },
        } as VerificationCodeGenerator;

        const delivery = {
            async send(input: Record<string, unknown>) {
                sentPayloads.push(input);
            },
        } as unknown as ContactVerificationDeliveryService;

        const uc = new RequestContactVerification(
            userRepo,
            tokenHasher,
            codeGenerator,
            delivery,
            {
                sessionTtl: 60_000,
                verificationCodeTtlMs: 300_000,
                verificationResendCooldownMs: 30_000,
            },
        );

        const result = await uc.execute({
            userId: "user-1",
            channel: "email",
        });

        assert.equal(result.channel, "email");
        assert.equal(result.retryAfterMs, 30_000);
        assert.ok(storedUser.emailVerificationExpiresAt instanceof Date);
        assert.equal(storedUser.emailVerificationCodeHash, "hash:123456");
        assert.equal(sentPayloads.length, 1);
        assert.equal(sentPayloads[0]?.code, "123456");
        assert.equal(appliedPatches.length, 1);
    });

    test("throws ValidationError when channel is already verified", async () => {
        const userRepo = {
            async getById() {
                return {
                    data: {
                        ...baseUser,
                        emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
                    },
                    meta: undefined,
                };
            },
        } as unknown as UserRepo;

        const uc = new RequestContactVerification(
            userRepo,
            {} as TokenHasher,
            {} as VerificationCodeGenerator,
            {} as ContactVerificationDeliveryService,
            {
                sessionTtl: 60_000,
                verificationCodeTtlMs: 300_000,
                verificationResendCooldownMs: 30_000,
            },
        );

        await assert.rejects(
            uc.execute({ userId: "user-1", channel: "email" }),
            (error) => error instanceof ValidationError && error.message === "Email already verified",
        );
    });

    test("clears code state when delivery fails", async () => {
        let storedUser: User = { ...baseUser };
        const patches: Array<Record<string, unknown>> = [];

        const userRepo = {
            async getById() {
                return { data: storedUser, meta: undefined };
            },
            async update(input: { patch: Partial<User> & { id: string } }) {
                patches.push(input.patch as Record<string, unknown>);
                storedUser = { ...storedUser, ...input.patch };
                return { data: storedUser, meta: undefined };
            },
        } as unknown as UserRepo;

        const tokenHasher = {
            async hash() {
                return "hash:654321";
            },
        } as unknown as TokenHasher;

        const codeGenerator = {
            generate() {
                return "654321";
            },
        } as VerificationCodeGenerator;

        const delivery = {
            async send() {
                throw new Error("boom");
            },
        } as ContactVerificationDeliveryService;

        const uc = new RequestContactVerification(
            userRepo,
            tokenHasher,
            codeGenerator,
            delivery,
            {
                sessionTtl: 60_000,
                verificationCodeTtlMs: 300_000,
                verificationResendCooldownMs: 30_000,
            },
        );

        await assert.rejects(
            uc.execute({ userId: "user-1", channel: "phone" }),
            (error) => error instanceof OperationFailedError,
        );

        assert.equal(storedUser.phoneVerificationCodeHash, null);
        assert.equal(storedUser.phoneVerificationExpiresAt, null);
        assert.equal(storedUser.phoneVerificationRequestedAt, null);
        assert.equal(patches.length, 2);
    });
});
