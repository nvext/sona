import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Refresh } from "~~/server/application/auth/uc/refresh";
import type { SessionRepo } from "~~/server/domain/session/repo";
import type { Session } from "~~/server/domain/session/entity";
import type { TokenHasher, Fingerprinter } from "~~/server/shared/hash";
import type { AccessTokenIssuer, RefreshTokenGenerator } from "~~/server/shared/token";
import { InvalidCredentialsError } from "~~/server/shared/errors";

const baseSession: Session = {
    id: "session-1",
    userId: "user-1",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    lastSeenAt: new Date(),
    revokedAt: null,
    refreshTokenHash: "hash:old-refresh",
    refreshTokenFamilyId: "family-1",
    refreshTokenFingerprint: "fp:old-refresh",
    version: 0,
};

function makeSut(options: { session: Session | null; updatedSession: Session | null }) {
    let updateInput:
        | {
              patch: Partial<Session> & { id: string };
              expectedVersion: number;
          }
        | null = null;

    const sessionRepo = {
        async getByRefreshFingerprint() {
            return { data: options.session, meta: undefined };
        },
        async updateIfVersion(input: {
            patch: Partial<Session> & { id: string };
            expectedVersion: number;
        }) {
            updateInput = input;
            return { data: options.updatedSession, meta: undefined };
        },
    } as unknown as SessionRepo;

    const refreshTokenGenerator = {
        generate() {
            return "new-refresh";
        },
    } as unknown as RefreshTokenGenerator;

    const accessTokenIssuer = {
        issue() {
            return "new-access";
        },
    } as unknown as AccessTokenIssuer;

    const tokenHasher = {
        async verify(hash: string, token: string) {
            return hash === "hash:old-refresh" && token === "old-refresh";
        },
        async hash(token: string) {
            return `hash:${token}`;
        },
    } as unknown as TokenHasher;

    const fingerprinter = {
        fingerprint(input: string) {
            return `fp:${input}`;
        },
    } as unknown as Fingerprinter;

    const uc = new Refresh(
        sessionRepo,
        refreshTokenGenerator,
        accessTokenIssuer,
        tokenHasher,
        fingerprinter,
        {
            sessionTtl: 60_000,
            verificationCodeTtlMs: 300_000,
            verificationResendCooldownMs: 30_000,
        },
    );

    return { uc, getUpdateInput: () => updateInput };
}

describe("Refresh", () => {
    test("rotates refresh token and returns new pair", async () => {
        const updatedSession: Session = { ...baseSession, version: 1 };
        const { uc, getUpdateInput } = makeSut({
            session: baseSession,
            updatedSession,
        });

        const result = await uc.execute({ refreshToken: "old-refresh" });

        assert.deepEqual(result, {
            accessToken: "new-access",
            refreshToken: "new-refresh",
        });

        const updateInput = getUpdateInput();
        assert.ok(updateInput);
        assert.equal(updateInput.expectedVersion, 0);
        assert.equal(updateInput.patch.id, "session-1");
        assert.equal(updateInput.patch.version, 1);
        assert.equal(updateInput.patch.refreshTokenHash, "hash:new-refresh");
        assert.equal(updateInput.patch.refreshTokenFingerprint, "fp:new-refresh");
    });

    test("throws InvalidCredentialsError when session not found", async () => {
        const { uc } = makeSut({
            session: null,
            updatedSession: null,
        });

        await assert.rejects(uc.execute({ refreshToken: "old-refresh" }), InvalidCredentialsError);
    });
});
