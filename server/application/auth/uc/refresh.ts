import { SessionRepo } from "~~/server/domain/session/repo";
import { InvalidCredentialsError } from "~~/server/shared/errors";
import { Fingerprinter, TokenHasher } from "~~/server/shared/hash";
import { AccessTokenIssuer, RefreshTokenGenerator } from "~~/server/shared/token";
import { AuthConfig } from "../config/AuthConfig";

export class Refresh {
    constructor(
        private readonly sessionRepo: SessionRepo,
        private readonly refreshTokenGenerator: RefreshTokenGenerator,
        private readonly accessTokenIssuer: AccessTokenIssuer,
        private readonly tokenHasher: TokenHasher,
        private readonly fingerprinter: Fingerprinter,
        private readonly config: AuthConfig,
    ) {}

    async execute(input: RefreshInput) {
        const refreshTokenFingerprint = this.fingerprinter.fingerprint(input.refreshToken);

        const { data: session } = await this.sessionRepo.getByRefreshFingerprint({
            fingerprint: refreshTokenFingerprint,
        });

        if (session === null) {
            throw new InvalidCredentialsError();
        }

        const now = new Date();
        const verified = await this.tokenHasher.verify(
            session.refreshTokenHash,
            input.refreshToken,
        );
        const revoked = session.revokedAt !== null;
        const expired = session.expiresAt <= now;

        if (!verified || revoked || expired) {
            throw new InvalidCredentialsError();
        }

        const newRefreshToken = this.refreshTokenGenerator.generate();

        const { data: updatedSession } = await this.sessionRepo.updateIfVersion({
            patch: {
                id: session.id,
                version: session.version + 1,
                refreshTokenHash: await this.tokenHasher.hash(newRefreshToken),
                refreshTokenFingerprint: this.fingerprinter.fingerprint(newRefreshToken),
                expiresAt: new Date(now.getTime() + this.config.sessionTtl),
                lastSeenAt: now,
            },
            expectedVersion: session.version,
        });

        if (!updatedSession) {
            throw new InvalidCredentialsError();
        }

        const accessToken = this.accessTokenIssuer.issue({
            userId: session.userId,
            sessionId: session.id,
            sessionVersion: session.version + 1,
        });

        return { accessToken, refreshToken: newRefreshToken };
    }
}

type RefreshInput = {
    refreshToken: string;
};
