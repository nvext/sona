import type { ContactVerificationChannel, ContactVerificationDeliveryService } from "~~/server/application/auth/services/contact-verification-delivery";
import type { VerificationCodeGenerator } from "~~/server/application/auth/services/verification-code-generator";
import type { AuthConfig } from "~~/server/application/auth/config/AuthConfig";
import type { UserRepo } from "~~/server/domain/user/repo";
import type { TokenHasher } from "~~/server/shared/hash";
import { NotFoundError, OperationFailedError, ValidationError } from "~~/server/shared/errors";

export class RequestContactVerification {
    constructor(
        private readonly userRepo: UserRepo,
        private readonly tokenHasher: TokenHasher,
        private readonly verificationCodeGenerator: VerificationCodeGenerator,
        private readonly contactVerificationDeliveryService: ContactVerificationDeliveryService,
        private readonly authConfig: AuthConfig,
    ) {}

    async execute(input: RequestContactVerificationInput) {
        const { data: user } = await this.userRepo.getById({ id: input.userId });
        if (user === null) {
            throw new NotFoundError("User not found");
        }

        const now = new Date();
        const channelState = readChannelState(user, input.channel);

        if (channelState.destination === null) {
            throw new ValidationError(`${capitalize(input.channel)} is not set`);
        }

        if (channelState.verifiedAt !== null) {
            throw new ValidationError(`${capitalize(input.channel)} already verified`);
        }

        if (
            channelState.requestedAt !== null &&
            now.getTime() - channelState.requestedAt.getTime() < this.authConfig.verificationResendCooldownMs
        ) {
            const retryAfterMs = this.authConfig.verificationResendCooldownMs -
                (now.getTime() - channelState.requestedAt.getTime());
            throw new ValidationError(
                `Verification code was already sent. Retry in ${Math.ceil(retryAfterMs / 1000)} seconds`,
            );
        }

        const code = this.verificationCodeGenerator.generate();
        const expiresAt = new Date(now.getTime() + this.authConfig.verificationCodeTtlMs);
        const codeHash = await this.tokenHasher.hash(code);

        const patch = buildRequestPatch({
            userId: user.id,
            channel: input.channel,
            codeHash,
            expiresAt,
            requestedAt: now,
            updatedAt: now,
        });

        await this.userRepo.update({ patch });

        try {
            await this.contactVerificationDeliveryService.send({
                userId: user.id,
                channel: input.channel,
                destination: channelState.destination,
                code,
                expiresAt,
            });
        } catch {
            await this.userRepo.update({
                patch: buildClearPatch({
                    userId: user.id,
                    channel: input.channel,
                    updatedAt: new Date(),
                }),
            });
            throw new OperationFailedError("Failed to deliver verification code");
        }

        return {
            channel: input.channel,
            expiresAt,
            retryAfterMs: this.authConfig.verificationResendCooldownMs,
        };
    }
}

type RequestContactVerificationInput = {
    userId: string;
    channel: ContactVerificationChannel;
};

function readChannelState(
    user: {
        email: string | null;
        phone: string | null;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
        emailVerificationRequestedAt: Date | null;
        phoneVerificationRequestedAt: Date | null;
    },
    channel: ContactVerificationChannel,
): {
    destination: string | null;
    verifiedAt: Date | null;
    requestedAt: Date | null;
} {
    if (channel === "email") {
        return {
            destination: user.email,
            verifiedAt: user.emailVerifiedAt,
            requestedAt: user.emailVerificationRequestedAt,
        };
    }

    return {
        destination: user.phone,
        verifiedAt: user.phoneVerifiedAt,
        requestedAt: user.phoneVerificationRequestedAt,
    };
}

function buildRequestPatch(input: {
    userId: string;
    channel: ContactVerificationChannel;
    codeHash: string;
    expiresAt: Date;
    requestedAt: Date;
    updatedAt: Date;
}) {
    if (input.channel === "email") {
        return {
            id: input.userId,
            emailVerificationCodeHash: input.codeHash,
            emailVerificationExpiresAt: input.expiresAt,
            emailVerificationRequestedAt: input.requestedAt,
            updatedAt: input.updatedAt,
        };
    }

    return {
        id: input.userId,
        phoneVerificationCodeHash: input.codeHash,
        phoneVerificationExpiresAt: input.expiresAt,
        phoneVerificationRequestedAt: input.requestedAt,
        updatedAt: input.updatedAt,
    };
}

function buildClearPatch(input: {
    userId: string;
    channel: ContactVerificationChannel;
    updatedAt: Date;
}) {
    if (input.channel === "email") {
        return {
            id: input.userId,
            emailVerificationCodeHash: null,
            emailVerificationExpiresAt: null,
            emailVerificationRequestedAt: null,
            updatedAt: input.updatedAt,
        };
    }

    return {
        id: input.userId,
        phoneVerificationCodeHash: null,
        phoneVerificationExpiresAt: null,
        phoneVerificationRequestedAt: null,
        updatedAt: input.updatedAt,
    };
}

function capitalize(value: string): string {
    if (value.length === 0) {
        return value;
    }
    return `${value[0]!.toUpperCase()}${value.slice(1)}`;
}
