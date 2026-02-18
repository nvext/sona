import { createHmac } from "node:crypto";
import { AccessTokenIssuer } from "~~/server/shared/token";

type AccessTokenIssuerConfig = {
    secret: string;
    ttlSeconds: number;
};

type AccessTokenPayload = {
    sub: string;
    sid: string;
    ver: number;
    iat: number;
    exp: number;
};

export class HmacAccessTokenIssuer implements AccessTokenIssuer {
    constructor(private readonly config: AccessTokenIssuerConfig) {}

    issue(input: { userId: string; sessionId: string; sessionVersion: number }): string {
        const now = Math.floor(Date.now() / 1000);
        const payload: AccessTokenPayload = {
            sub: input.userId,
            sid: input.sessionId,
            ver: input.sessionVersion,
            iat: now,
            exp: now + this.config.ttlSeconds,
        };

        const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
        const signature = createHmac("sha256", this.config.secret).update(payloadEncoded).digest("base64url");

        return `${payloadEncoded}.${signature}`;
    }
}
