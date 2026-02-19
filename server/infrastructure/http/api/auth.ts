import { createError, getHeader, type H3Event } from "h3";
import { resolveContainer } from "./use-cases";
import type { AccessTokenClaims } from "~~/server/shared/token";

type ApiEventContext = {
    auth?: AccessTokenClaims;
};

export async function requireAuth(event: H3Event): Promise<AccessTokenClaims> {
    const context = event.context as ApiEventContext;
    if (context.auth) {
        return context.auth;
    }

    const authorization = getHeader(event, "authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (token.length === 0) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const container = resolveContainer(event);
    const claims = container.services.accessTokenVerifier.verify(token);
    if (claims === null) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const { data: session } = await container.repos.sessionRepo.getById({ id: claims.sessionId });
    const now = new Date();
    if (
        session === null ||
        session.userId !== claims.userId ||
        session.version !== claims.sessionVersion ||
        session.revokedAt !== null ||
        session.expiresAt <= now
    ) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    context.auth = claims;
    return claims;
}
