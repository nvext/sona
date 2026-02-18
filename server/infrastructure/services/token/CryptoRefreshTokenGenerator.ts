import { randomBytes } from "node:crypto";
import { RefreshTokenGenerator } from "~~/server/shared/token";

export class CryptoRefreshTokenGenerator implements RefreshTokenGenerator {
    generate(): string {
        return randomBytes(48).toString("base64url");
    }
}
