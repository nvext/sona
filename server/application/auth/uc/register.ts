import type { UserRepo } from "~~/server/domain/user/repo";
import type { PasswordHasher } from "~~/server/shared/hash";
import type { EntityIdGenerator } from "~~/server/shared/id";
import { ConflictError } from "~~/server/shared/errors";

export class Register {
    constructor(
        private readonly userRepo: UserRepo,
        private readonly entityIdGenerator: EntityIdGenerator,
        private readonly passwordHasher: PasswordHasher,
    ) {}

    async execute(input: RegisterInput) {
        const normalizedEmail = input.email !== undefined ? input.email.trim().toLowerCase() : null;
        const normalizedPhone = input.phone !== undefined ? input.phone.trim() : null;

        if (normalizedEmail !== null) {
            const { data: existingUser } = await this.userRepo.getByEmail({ email: normalizedEmail });
            if (existingUser !== null) {
                throw new ConflictError("Email already in use");
            }
        }

        if (normalizedPhone !== null) {
            const { data: existingUser } = await this.userRepo.getByPhone({ phone: normalizedPhone });
            if (existingUser !== null) {
                throw new ConflictError("Phone already in use");
            }
        }

        const { data: user } = await this.userRepo.add({
            entity: {
                id: this.entityIdGenerator.generate(),
                name: null,
                email: normalizedEmail,
                phone: normalizedPhone,
                emailVerifiedAt: null,
                phoneVerifiedAt: null,
                emailVerificationCodeHash: null,
                emailVerificationExpiresAt: null,
                emailVerificationRequestedAt: null,
                phoneVerificationCodeHash: null,
                phoneVerificationExpiresAt: null,
                phoneVerificationRequestedAt: null,
                passwordHash: await this.passwordHasher.hash(input.password),
                sessionVersion: 0,
                role: "customer",
                status: "active",
                createdAt: new Date(),
                updatedAt: null,
            },
        });

        return {
            user,
        };
    }
}

type RegisterInput =
    | {
          email: string;
          phone?: never;
          password: string;
      }
    | {
          phone: string;
          email?: never;
          password: string;
      };
