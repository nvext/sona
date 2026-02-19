import { createError, getCookie, getHeader, setCookie, type H3Event } from "h3";
import { resolveContainer } from "./use-cases";
import type { AccessTokenClaims } from "~~/server/shared/token";
import { readAuthConfigFromEnv } from "~~/server/infrastructure/services";

type ApiEventContext = {
    auth?: AccessTokenClaims;
};

export async function requireAuth(event: H3Event): Promise<AccessTokenClaims> {
    const context = event.context as ApiEventContext;
    if (context.auth) {
        return context.auth;
    }

    const token = resolveAccessToken(event);
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

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

export function resolveAccessToken(event: H3Event): string {
    const authorization = getHeader(event, "authorization");
    if (authorization && authorization.startsWith("Bearer ")) {
        return authorization.slice("Bearer ".length).trim();
    }

    return getCookie(event, ACCESS_COOKIE_NAME) ?? "";
}

export function resolveRefreshToken(event: H3Event): string {
    return getCookie(event, REFRESH_COOKIE_NAME) ?? "";
}

export function setAuthCookies(event: H3Event, accessToken: string, refreshToken: string): void {
    const { authConfig, accessTokenConfig } = readAuthConfigFromEnv();
    const isSecure = process.env.NODE_ENV === "production";

    setCookie(event, ACCESS_COOKIE_NAME, accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: Math.max(1, Math.floor(accessTokenConfig.ttlMs / 1000)),
    });

    setCookie(event, REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: Math.max(1, Math.floor(authConfig.sessionTtl / 1000)),
    });
}

export function clearAuthCookies(event: H3Event): void {
    const isSecure = process.env.NODE_ENV === "production";

    setCookie(event, ACCESS_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: 0,
    });

    setCookie(event, REFRESH_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: 0,
    });
}
