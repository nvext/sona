import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Logout } from "~~/server/application/auth/uc/logout";
import type { SessionRepo } from "~~/server/domain/session/repo";

describe("Logout", () => {
    test("returns revoked=true when repo revokes session", async () => {
        const revokeCalls: { id: string; now: Date }[] = [];

        const sessionRepo = {
            async revoke(input: { id: string; now: Date }) {
                revokeCalls.push(input);
                return { data: true, meta: undefined };
            },
        } as unknown as SessionRepo;

        const uc = new Logout(sessionRepo);

        const result = await uc.execute({ sessionId: "session-1" });

        assert.equal(revokeCalls.length, 1);
        assert.equal(revokeCalls[0].id, "session-1");
        assert.ok(revokeCalls[0].now instanceof Date);
        assert.equal(result.revoked, true);
    });

    test("returns revoked=false when repo reports no-op", async () => {
        const sessionRepo = {
            async revoke() {
                return { data: false, meta: undefined };
            },
        } as unknown as SessionRepo;

        const uc = new Logout(sessionRepo);
        const result = await uc.execute({ sessionId: "missing-session" });

        assert.equal(result.revoked, false);
    });
});
