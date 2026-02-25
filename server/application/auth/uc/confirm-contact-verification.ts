import type { ContactVerificationChannel } from "~~/server/application/auth/services/contact-verification-delivery";
import type { UserRepo } from "~~/server/domain/user/repo";
import type { TokenHasher } from "~~/server/shared/hash";
import { NotFoundError, ValidationError } from "~~/server/shared/errors";

export class ConfirmContactVerification {
    constructor(
        private readonly userRepo: UserRepo,
        private readonly tokenHasher: TokenHasher,
    ) {}

    async execute(input: ConfirmContactVerificationInput) {
        const code = normalizeCode(input.code);
        if (!/^\d{6}$/.test(code)) {
            throw new ValidationError("Verification code must contain 6 digits");
        }

        const { data: user } = await this.userRepo.getById({ id: input.userId });
        if (user === null) {
            throw new NotFoundError("User not found");
        }

        const state = readChannelVerificationState(user, input.channel);
        if (state.destination === null) {
            throw new ValidationError(`${capitalize(input.channel)} is not set`);
        }

        if (state.codeHash === null || state.expiresAt === null) {
            if (state.verifiedAt !== null) {
                throw new ValidationError(`${capitalize(input.channel)} already verified`);
            }
            throw new ValidationError("Verification code was not requested");
        }

        const now = new Date();
        if (state.expiresAt.getTime() <= now.getTime()) {
            throw new ValidationError("Verification code has expired");
        }

        const verified = await this.tokenHasher.verify(state.codeHash, code);
        if (!verified) {
            throw new ValidationError("Invalid verification code");
        }

        const patch = buildVerifiedPatch({
            userId: user.id,
            channel: input.channel,
            now,
        });
        const { data: updatedUser } = await this.userRepo.update({ patch });
        if (updatedUser === null) {
            throw new NotFoundError("User not found");
        }

        return {
            user: updatedUser,
            channel: input.channel,
            verifiedAt: now,
        };
    }
}

type ConfirmContactVerificationInput = {
    userId: string;
    channel: ContactVerificationChannel;
    code: string;
};

function normalizeCode(value: string): string {
    return value.trim();
}

function readChannelVerificationState(
    user: {
        email: string | null;
        phone: string | null;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
        emailVerificationCodeHash: string | null;
        phoneVerificationCodeHash: string | null;
        emailVerificationExpiresAt: Date | null;
        phoneVerificationExpiresAt: Date | null;
    },
    channel: ContactVerificationChannel,
) {
    if (channel === "email") {
        return {
            destination: user.email,
            verifiedAt: user.emailVerifiedAt,
            codeHash: user.emailVerificationCodeHash,
            expiresAt: user.emailVerificationExpiresAt,
        };
    }

    return {
        destination: user.phone,
        verifiedAt: user.phoneVerifiedAt,
        codeHash: user.phoneVerificationCodeHash,
        expiresAt: user.phoneVerificationExpiresAt,
    };
}

function buildVerifiedPatch(input: {
    userId: string;
    channel: ContactVerificationChannel;
    now: Date;
}) {
    if (input.channel === "email") {
        return {
            id: input.userId,
            emailVerifiedAt: input.now,
            emailVerificationCodeHash: null,
            emailVerificationExpiresAt: null,
            emailVerificationRequestedAt: null,
            updatedAt: input.now,
        };
    }

    return {
        id: input.userId,
        phoneVerifiedAt: input.now,
        phoneVerificationCodeHash: null,
        phoneVerificationExpiresAt: null,
        phoneVerificationRequestedAt: null,
        updatedAt: input.now,
    };
}

function capitalize(value: string): string {
    if (value.length === 0) {
        return value;
    }
    return `${value[0]!.toUpperCase()}${value.slice(1)}`;
}
