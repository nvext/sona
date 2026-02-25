import type { H3Event } from "h3";
import { resolveContainer } from "~~/server/infrastructure/http/api/use-cases";
import { InvalidCredentialsError } from "~~/server/shared/errors";

type AuthIdentifierInput =
    | {
          email: string;
          password: string;
      }
    | {
          phone: string;
          password: string;
      };

export async function resolveUserByCredentials(event: H3Event, input: AuthIdentifierInput): Promise<{
    userId: string;
    channel: "email" | "phone";
    identifier: string;
}> {
    const container = resolveContainer(event);
    const user = "email" in input
        ? (await container.repos.userRepo.getByEmail({ email: input.email.trim().toLowerCase() })).data
        : (await container.repos.userRepo.getByPhone({ phone: input.phone.trim() })).data;

    if (!user || user.status !== "active") {
        throw new InvalidCredentialsError();
    }

    const verifiedPassword = await container.services.passwordHasher.verify(
        user.passwordHash,
        input.password,
    );
    if (!verifiedPassword) {
        throw new InvalidCredentialsError();
    }

    if ("email" in input) {
        return {
            userId: user.id,
            channel: "email",
            identifier: input.email.trim().toLowerCase(),
        };
    }

    return {
        userId: user.id,
        channel: "phone",
        identifier: input.phone.trim(),
    };
}
