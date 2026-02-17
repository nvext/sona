import { SessionRepo } from "~~/server/domain/session/repo";
import { UserRepo } from "~~/server/domain/user/repo";
import { Fingerprinter, PasswordHasher, TokenHasher } from "~~/server/shared/hash";
import { EntityIdGenerator, UniqueIdGenerator } from "~~/server/shared/id";
import { AccessTokenIssuer, RefreshTokenGenerator } from "~~/server/shared/token";
import { AuthConfig } from "../config/AuthConfig";
import { InvalidCredentialsError } from "~~/server/shared/errors/InvalidCredentialsError";

export class Login {
    constructor(
        private readonly userRepo: UserRepo,
        private readonly sessionRepo: SessionRepo,
        private readonly passwordHasher: PasswordHasher,
        private readonly entityIdGenerator: EntityIdGenerator,
        private readonly uniqueIdGenerator: UniqueIdGenerator,
        private readonly accessTokenIssuer: AccessTokenIssuer,
        private readonly refreshTokenGenerator: RefreshTokenGenerator,
        private readonly tokenHasher: TokenHasher,
        private readonly fingerprinter: Fingerprinter,
        private readonly config: AuthConfig,
    ) {}

    async execute(input: LoginInput) {
        const user = await this.getUserByIdentifier(
            "email" in input ? { email: input.email } : { phone: input.phone },
        );

        if (
            user === null ||
            user.status !== "active" ||
            !(await this.passwordHasher.verify(user.passwordHash, input.password))
        ) {
            throw new InvalidCredentialsError();
        }

        const refreshToken = this.refreshTokenGenerator.generate();

        const now = new Date();

        const { data: session } = await this.sessionRepo.add({
            entity: {
                id: this.entityIdGenerator.generate(),
                userId: user.id,
                createdAt: now,
                expiresAt: new Date(now.getTime() + this.config.sessionTtl),
                lastSeenAt: now,
                revokedAt: null,
                refreshTokenHash: await this.tokenHasher.hash(refreshToken),
                refreshTokenFamilyId: this.uniqueIdGenerator.generate(),
                refreshTokenFingerprint: this.fingerprinter.fingerprint(refreshToken),
                version: 0,
            },
        });

        const accessToken = this.accessTokenIssuer.issue({
            userId: user.id,
            sessionId: session.id,
            sessionVersion: session.version,
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    private async getUserByIdentifier(input: { email: string } | { phone: string }) {
        if ("email" in input) {
            const email = input.email.trim().toLowerCase();
            return (await this.userRepo.getByEmail({ email })).data;
        } else {
            const phone = input.phone.trim();
            return (await this.userRepo.getByPhone({ phone })).data;
        }
    }
}

type LoginInput =
    | {
          email: string;
          password: string;
      }
    | {
          phone: string;
          password: string;
      };
