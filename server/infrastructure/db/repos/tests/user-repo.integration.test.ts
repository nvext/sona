import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgUserRepo } from "~~/server/infrastructure/db";
import { setupDbTestHooks, seedUser } from "./_helpers";

setupDbTestHooks();

describe("PgUserRepo", () => {
    test("add/getByEmail/getByPhone", async () => {
        const userRepo = new PgUserRepo();
        await seedUser();

        const byEmail = await userRepo.getByEmail({ email: "user@example.com" });
        const byPhone = await userRepo.getByPhone({ phone: "+10000000000" });

        assert.equal(byEmail.data?.id, "user-1");
        assert.equal(byPhone.data?.id, "user-1");
    });
});
