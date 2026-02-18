import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgSessionRepo } from "~~/server/infrastructure/db";
import { FIXED_NOW, seedUser, setupDbTestHooks } from "./_helpers";

setupDbTestHooks();

describe("PgSessionRepo", () => {
    test("add/getByRefreshFingerprint/updateIfVersion/revoke", async () => {
        await seedUser();
        const sessionRepo = new PgSessionRepo();

        await sessionRepo.add({
            entity: {
                id: "session-1",
                userId: "user-1",
                createdAt: FIXED_NOW,
                expiresAt: new Date(FIXED_NOW.getTime() + 60_000),
                lastSeenAt: FIXED_NOW,
                revokedAt: null,
                refreshTokenHash: "token-hash",
                refreshTokenFamilyId: "family-1",
                refreshTokenFingerprint: "fp-1",
                version: 0,
            },
        });

        const byFingerprint = await sessionRepo.getByRefreshFingerprint({ fingerprint: "fp-1" });
        assert.equal(byFingerprint.data?.id, "session-1");

        const updated = await sessionRepo.updateIfVersion({
            patch: { id: "session-1", version: 1, refreshTokenFingerprint: "fp-2" },
            expectedVersion: 0,
        });
        assert.equal(updated.data?.version, 1);
        assert.equal(updated.data?.refreshTokenFingerprint, "fp-2");

        const revoke = await sessionRepo.revoke({ id: "session-1", now: new Date() });
        assert.equal(revoke.data, true);
    });
});
