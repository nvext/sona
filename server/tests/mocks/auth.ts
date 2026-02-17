import type { User } from "~~/server/domain/user/entity";
import { Login } from "~~/server/application/auth/uc/login";
import { baseUser } from "~~/server/tests/fixtures/auth";
import {
    StubFingerprinter,
    StubPasswordHasher,
    StubTokenHasher,
} from "~~/server/tests/mocks/hash";
import { StubEntityIdGenerator, StubUniqueIdGenerator } from "~~/server/tests/mocks/id";
import { InMemorySessionRepo } from "~~/server/tests/mocks/repositories/session-repo";
import { InMemoryUserRepo } from "~~/server/tests/mocks/repositories/user-repo";
import { StubAccessTokenIssuer, StubRefreshTokenGenerator } from "~~/server/tests/mocks/token";

export { baseUser };
export { StubPasswordHasher };

export function makeLoginSut(input: { user: User | null; verifyResult: boolean }) {
    const userRepo = new InMemoryUserRepo(input.user);
    const sessionRepo = new InMemorySessionRepo();
    const passwordHasher = new StubPasswordHasher(input.verifyResult);

    const uc = new Login(
        userRepo,
        sessionRepo,
        passwordHasher,
        new StubEntityIdGenerator(),
        new StubUniqueIdGenerator(),
        new StubAccessTokenIssuer(),
        new StubRefreshTokenGenerator(),
        new StubTokenHasher(),
        new StubFingerprinter(),
        { sessionTtl: 60_000 },
    );

    return { uc, sessionRepo, passwordHasher };
}
