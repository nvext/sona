import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Register } from "~~/server/application/auth/uc/register";
import type { UserRepo } from "~~/server/domain/user/repo";
import type { User } from "~~/server/domain/user/entity";
import type { PasswordHasher } from "~~/server/shared/hash";
import type { EntityIdGenerator } from "~~/server/shared/id";

describe("Register", () => {
    test("creates user with normalized email and hashed password", async () => {
        const addedUsers: User[] = [];

        const userRepo = {
            async add(input: { entity: User }) {
                addedUsers.push(input.entity);
                return { data: input.entity, meta: undefined };
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
        assert.equal(addedUsers[0].email, "user@example.com");
        assert.equal(addedUsers[0].phone, null);
        assert.equal(addedUsers[0].passwordHash, "hashed:secret");
        assert.equal(result.user.id, "user-1");
    });
});
