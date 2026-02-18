import { createHmac, timingSafeEqual } from "node:crypto";
import { AccessTokenClaims, AccessTokenVerifier } from "~~/server/shared/token";

type AccessTokenVerifierConfig = {
    secret: string;
};

type AccessTokenPayload = {
    sub: string;
    sid: string;
    ver: number;
    iat: number;
    exp: number;
};

export class HmacAccessTokenVerifier implements AccessTokenVerifier {
    constructor(private readonly config: AccessTokenVerifierConfig) {}

    verify(token: string): AccessTokenClaims | null {
        const separatorIndex = token.indexOf(".");
        if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
            return null;
        }

        const payloadEncoded = token.slice(0, separatorIndex);
        const signature = token.slice(separatorIndex + 1);
        const expectedSignature = createHmac("sha256", this.config.secret)
            .update(payloadEncoded)
            .digest("base64url");

        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        if (
            signatureBuffer.length !== expectedBuffer.length ||
            !timingSafeEqual(signatureBuffer, expectedBuffer)
        ) {
            return null;
        }

        let payload: AccessTokenPayload;
        try {
            payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf8"));
        } catch {
            return null;
        }

        if (
            typeof payload.sub !== "string" ||
            payload.sub.length === 0 ||
            typeof payload.sid !== "string" ||
            payload.sid.length === 0 ||
            typeof payload.ver !== "number" ||
            !Number.isInteger(payload.ver) ||
            payload.ver < 0 ||
            typeof payload.exp !== "number"
        ) {
            return null;
        }

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp <= now) {
            return null;
        }

        return {
            userId: payload.sub,
            sessionId: payload.sid,
            sessionVersion: payload.ver,
        };
    }
}
