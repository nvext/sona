import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Register } from "~~/server/application/auth/uc/register";
import type { UserRepo } from "~~/server/domain/user/repo";
import type { User } from "~~/server/domain/user/entity";
import type { PasswordHasher } from "~~/server/shared/hash";
import type { EntityIdGenerator } from "~~/server/shared/id";
import { ConflictError } from "~~/server/shared/errors";

describe("Register", () => {
    test("creates user with normalized email and hashed password", async () => {
        const addedUsers: User[] = [];

        const userRepo = {
            async add(input: { entity: User }) {
                addedUsers.push(input.entity);
                return { data: input.entity, meta: undefined };
            },
            async getByEmail() {
                return { data: null, meta: undefined };
            },
            async getByPhone() {
                return { data: null, meta: undefined };
            },
        } as unknown as UserRepo;

        const passwordHasher = {
            async hash(password: string) {
                return `hashed:${password}`;
            },
        } as unknown as PasswordHasher;

        const entityIdGenerator = {
            generate() {
                return "user-1";
            },
        } as unknown as EntityIdGenerator;

        const uc = new Register(userRepo, entityIdGenerator, passwordHasher);

        const result = await uc.execute({
            email: "  USER@Example.COM ",
            password: "secret",
        });

        assert.equal(addedUsers.length, 1);
        assert.equal(addedUsers[0].id, "user-1");
        assert.equal(addedUsers[0].name, null);
        assert.equal(addedUsers[0].email, "user@example.com");
        assert.equal(addedUsers[0].phone, null);
        assert.equal(addedUsers[0].passwordHash, "hashed:secret");
        assert.equal(result.user.id, "user-1");
    });

    test("throws ConflictError when email already exists", async () => {
        const existingUser: User = {
            id: "existing-user",
            name: null,
            email: "user@example.com",
            phone: null,
            passwordHash: "hash",
            createdAt: new Date(),
            updatedAt: null,
            sessionVersion: 0,
            status: "active",
        };

        const userRepo = {
            async getByEmail() {
                return { data: existingUser, meta: undefined };
            },
            async getByPhone() {
                return { data: null, meta: undefined };
            },
        } as unknown as UserRepo;

        const passwordHasher = {
            async hash(password: string) {
                return `hashed:${password}`;
            },
        } as unknown as PasswordHasher;

        const entityIdGenerator = {
            generate() {
                return "user-1";
            },
        } as unknown as EntityIdGenerator;

        const uc = new Register(userRepo, entityIdGenerator, passwordHasher);

        await assert.rejects(
            uc.execute({ email: "user@example.com", password: "secret" }),
            (error) => error instanceof ConflictError && error.message === "Email already in use",
        );
    });

    test("throws ConflictError when phone already exists", async () => {
        const existingUser: User = {
            id: "existing-user",
            name: null,
            email: null,
            phone: "+10000000000",
            passwordHash: "hash",
            createdAt: new Date(),
            updatedAt: null,
            sessionVersion: 0,
            status: "active",
        };

        const userRepo = {
            async getByEmail() {
                return { data: null, meta: undefined };
            },
            async getByPhone() {
                return { data: existingUser, meta: undefined };
            },
        } as unknown as UserRepo;

        const passwordHasher = {
            async hash(password: string) {
                return `hashed:${password}`;
            },
        } as unknown as PasswordHasher;

        const entityIdGenerator = {
            generate() {
                return "user-1";
            },
        } as unknown as EntityIdGenerator;

        const uc = new Register(userRepo, entityIdGenerator, passwordHasher);

        await assert.rejects(
            uc.execute({ phone: "+10000000000", password: "secret" }),
            (error) => error instanceof ConflictError && error.message === "Phone already in use",
        );
    });
});
