import { createError, getHeader, setHeader, type H3Event } from "h3";
import { readRuntimeEnv } from "~~/server/infrastructure/runtime/env";

type RateLimitBucket = "auth" | "submit";

type RateLimitState = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, RateLimitState>();

function resolveClientIp(event: H3Event): string {
    const forwardedFor = getHeader(event, "x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    return event.node.req.socket.remoteAddress ?? "unknown";
}

function resolveBucket(path: string): RateLimitBucket | null {
    if (path.startsWith("/auth/")) {
        return "auth";
    }
    if (path === "/checkout/submit") {
        return "submit";
    }
    return null;
}

export function applyCors(event: H3Event): void {
    const env = readRuntimeEnv();
    const origin = getHeader(event, "origin");
    const allowedOrigins = env.cors.allowedOrigins;

    if (!origin) {
        return;
    }

    if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        throw createError({
            statusCode: 403,
            statusMessage: "Origin not allowed",
        });
    }

    setHeader(event, "vary", "origin");
    setHeader(event, "access-control-allow-origin", origin);
    setHeader(event, "access-control-allow-methods", "GET,POST,DELETE,OPTIONS");
    setHeader(event, "access-control-allow-headers", "content-type,authorization");
}

export function enforceRateLimit(event: H3Event): void {
    const bucket = resolveBucket(event.path);
    if (!bucket) {
        return;
    }

    const env = readRuntimeEnv();
    const max = bucket === "auth" ? env.rateLimit.authMax : env.rateLimit.submitMax;
    const windowMs = env.rateLimit.windowMs;
    const now = Date.now();
    const clientKey = `${bucket}:${resolveClientIp(event)}`;
    const current = buckets.get(clientKey);

    if (!current || current.resetAt <= now) {
        buckets.set(clientKey, {
            count: 1,
            resetAt: now + windowMs,
        });
        return;
    }

    current.count += 1;
    if (current.count > max) {
        throw createError({
            statusCode: 429,
            statusMessage: "Too Many Requests",
        });
    }
}

export function resetSecurityStateForTests(): void {
    buckets.clear();
}
