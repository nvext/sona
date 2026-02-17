import type { AccessTokenIssuer, RefreshTokenGenerator } from "~~/server/shared/token";

export class StubAccessTokenIssuer implements AccessTokenIssuer {
    issue(): string {
        return "access-token";
    }
}

export class StubRefreshTokenGenerator implements RefreshTokenGenerator {
    generate(): string {
        return "refresh-token";
    }
}
