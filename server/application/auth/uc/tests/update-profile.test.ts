import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { UpdateProfile } from "~~/server/application/auth/uc/update-profile";
import type { User } from "~~/server/domain/user/entity";
import type { UserRepo } from "~~/server/domain/user/repo";
import { ConflictError, NotFoundError, ValidationError } from "~~/server/shared/errors";

const baseUser: User = {
    id: "user-1",
    name: null,
    email: "user@example.com",
    phone: "+10000000000",
    emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
    phoneVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
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

describe("UpdateProfile", () => {
    test("updates and normalizes email", async () => {
        let storedUser: User = { ...baseUser };
        let appliedPatch: any = null;

        const userRepo = {
            async getById() {
                return { data: storedUser, meta: undefined };
            },
            async getByEmail() {
                return { data: null, meta: undefined };
            },
            async getByPhone() {
                return { data: null, meta: undefined };
            },
            async update(input: any) {
                appliedPatch = input.patch;
                storedUser = { ...storedUser, ...input.patch };
                return { data: storedUser, meta: undefined };
            },
        } as unknown as UserRepo;

        const uc = new UpdateProfile(userRepo);
        const result = await uc.execute({
            userId: baseUser.id,
            email: "  NEW@Example.COM  ",
        });

        assert.equal(result.user.email, "new@example.com");
        assert.equal(result.user.name, null);
        assert.equal(result.user.phone, baseUser.phone);
        assert.equal(appliedPatch.id, baseUser.id);
        assert.equal(appliedPatch.email, "new@example.com");
        assert.ok(appliedPatch.updatedAt instanceof Date);
    });

    test("updates and normalizes name", async () => {
        let storedUser: User = { ...baseUser };
        let appliedPatch: any = null;

        const userRepo = {
            async getById() {
                return { data: storedUser, meta: undefined };
            },
            async getByEmail() {
                return { data: null, meta: undefined };
            },
            async getByPhone() {
                return { data: null, meta: undefined };
            },
            async update(input: any) {
                appliedPatch = input.patch;
                storedUser = { ...storedUser, ...input.patch };
                return { data: storedUser, meta: undefined };
            },
        } as unknown as UserRepo;

        const uc = new UpdateProfile(userRepo);
        const result = await uc.execute({
            userId: baseUser.id,
            name: "  Иван Петров  ",
        });

        assert.equal(result.user.name, "Иван Петров");
        assert.equal(result.user.email, baseUser.email);
        assert.equal(result.user.phone, baseUser.phone);
        assert.equal(appliedPatch.name, "Иван Петров");
        assert.ok(appliedPatch.updatedAt instanceof Date);
    });

    test("throws ConflictError when email already in use", async () => {
        const userRepo = {
            async getById() {
                return { data: baseUser, meta: undefined };
            },
            async getByEmail() {
                return {
                    data: {
                        ...baseUser,
                        id: "other-user",
                        name: "Other",
                        email: "taken@example.com",
                    },
                    meta: undefined,
                };
            },
            async getByPhone() {
                return { data: null, meta: undefined };
            },
        } as unknown as UserRepo;

        const uc = new UpdateProfile(userRepo);

        await assert.rejects(
            uc.execute({
                userId: baseUser.id,
                email: "taken@example.com",
            }),
            (error) => error instanceof ConflictError && error.message === "Email already in use",
        );
    });

    test("throws ValidationError when both contacts are removed", async () => {
        const userRepo = {
            async getById() {
                return { data: baseUser, meta: undefined };
            },
            async getByEmail() {
                return { data: null, meta: undefined };
            },
            async getByPhone() {
                return { data: null, meta: undefined };
            },
        } as unknown as UserRepo;

        const uc = new UpdateProfile(userRepo);

        await assert.rejects(
            uc.execute({
                userId: baseUser.id,
                email: null,
                phone: null,
            }),
            (error) => error instanceof ValidationError && error.message === "At least one contact is required",
        );
    });

    test("resets email verification state when email changes", async () => {
        let storedUser: User = { ...baseUser };
        let appliedPatch: any = null;

        const userRepo = {
            async getById() {
                return { data: storedUser, meta: undefined };
            },
            async getByEmail() {
                return { data: null, meta: undefined };
            },
            async getByPhone() {
                return { data: null, meta: undefined };
            },
            async update(input: any) {
                appliedPatch = input.patch;
                storedUser = { ...storedUser, ...input.patch };
                return { data: storedUser, meta: undefined };
            },
        } as unknown as UserRepo;

        const uc = new UpdateProfile(userRepo);
        const result = await uc.execute({
            userId: baseUser.id,
            email: "fresh@example.com",
        });

        assert.equal(result.user.email, "fresh@example.com");
        assert.equal(result.user.emailVerifiedAt, null);
        assert.equal(result.user.emailVerificationCodeHash, null);
        assert.equal(result.user.emailVerificationExpiresAt, null);
        assert.equal(result.user.emailVerificationRequestedAt, null);
        assert.equal(appliedPatch.emailVerifiedAt, null);
    });

    test("throws NotFoundError when user does not exist", async () => {
        const userRepo = {
            async getById() {
                return { data: null, meta: undefined };
            },
        } as unknown as UserRepo;

        const uc = new UpdateProfile(userRepo);

        await assert.rejects(
            uc.execute({
                userId: "missing-user",
                email: "new@example.com",
            }),
            (error) => error instanceof NotFoundError && error.message === "User not found",
        );
    });
});
