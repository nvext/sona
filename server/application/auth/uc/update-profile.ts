import type { UserRepo } from "~~/server/domain/user/repo";
import { ConflictError, NotFoundError, ValidationError } from "~~/server/shared/errors";

export class UpdateProfile {
    constructor(private readonly userRepo: UserRepo) {}

    async execute(input: UpdateProfileInput) {
        const { data: currentUser } = await this.userRepo.getById({ id: input.userId });
        if (currentUser === null) {
            throw new NotFoundError("User not found");
        }

        const nextEmail = input.email === undefined
            ? currentUser.email
            : normalizeEmail(input.email);
        const nextPhone = input.phone === undefined
            ? currentUser.phone
            : normalizePhone(input.phone);

        if (nextEmail === null && nextPhone === null) {
            throw new ValidationError("At least one contact is required");
        }

        if (nextEmail !== null && nextEmail !== currentUser.email) {
            const { data: existingUser } = await this.userRepo.getByEmail({ email: nextEmail });
            if (existingUser !== null && existingUser.id !== currentUser.id) {
                throw new ConflictError("Email already in use");
            }
        }

        if (nextPhone !== null && nextPhone !== currentUser.phone) {
            const { data: existingUser } = await this.userRepo.getByPhone({ phone: nextPhone });
            if (existingUser !== null && existingUser.id !== currentUser.id) {
                throw new ConflictError("Phone already in use");
            }
        }

        const patch: {
            id: string;
            email?: string | null;
            phone?: string | null;
            updatedAt: Date;
        } = {
            id: currentUser.id,
            updatedAt: new Date(),
        };

        if (input.email !== undefined) {
            patch.email = nextEmail;
        }
        if (input.phone !== undefined) {
            patch.phone = nextPhone;
        }

        const { data: user } = await this.userRepo.update({ patch });
        if (user === null) {
            throw new NotFoundError("User not found");
        }

        return { user };
    }
}

type UpdateProfileInput = {
    userId: string;
    email?: string | null;
    phone?: string | null;
};

function normalizeEmail(value: string | null): string | null {
    if (value === null) {
        return null;
    }
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
}

function normalizePhone(value: string | null): string | null {
    if (value === null) {
        return null;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}
