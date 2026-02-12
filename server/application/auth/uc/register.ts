import { UserRepo } from "~~/server/domain/user/repo";
import { PasswordHasher } from "~~/server/shared/hash";
import { EntityIdGenerator } from "~~/server/shared/id";

export class Register {
    constructor(
        private readonly userRepo: UserRepo,
        private readonly entityIdGenerator: EntityIdGenerator,
        private readonly passwordHasher: PasswordHasher,
    ) {}

    async execute(input: RegisterInput) {
        const { data: user } = await this.userRepo.add({
            entity: {
                id: this.entityIdGenerator.generate(),
                email: input.email !== undefined ? input.email.trim().toLowerCase() : null,
                phone: input.phone !== undefined ? input.phone.trim() : null,
                passwordHash: await this.passwordHasher.hash(input.password),
                sessionVersion: 0,
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
