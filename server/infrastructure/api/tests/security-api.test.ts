import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import healthHandler from "~~/server/infrastructure/api/health.get";
import loginHandler from "~~/server/infrastructure/api/auth/login.post";
import submitHandler from "~~/server/infrastructure/api/checkout/submit.post";
import { resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";
import { resetSecurityStateForTests } from "~~/server/infrastructure/api/_shared/security";
import { callApi } from "./_helpers";

describe("infra api security", () => {
    const originalAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;
    const originalWindow = process.env.RATE_LIMIT_WINDOW_MS;
    const originalAuthMax = process.env.RATE_LIMIT_AUTH_MAX;
    const originalSubmitMax = process.env.RATE_LIMIT_SUBMIT_MAX;

    beforeEach(() => {
        process.env.CORS_ALLOWED_ORIGINS = originalAllowedOrigins;
        process.env.RATE_LIMIT_WINDOW_MS = originalWindow;
        process.env.RATE_LIMIT_AUTH_MAX = originalAuthMax;
        process.env.RATE_LIMIT_SUBMIT_MAX = originalSubmitMax;
        resetRuntimeEnvCacheForTests();
        resetSecurityStateForTests();
    });

    test("returns CORS headers for allowed origin", async () => {
        process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";
        resetRuntimeEnvCacheForTests();

        const response = await callApi({
            route: "/health",
            handler: healthHandler as any,
            headers: { origin: "https://allowed.example" },
        });

        assert.equal(response.status, 200);
        assert.equal(response.headers["access-control-allow-origin"], "https://allowed.example");
    });

    test("rejects disallowed origin", async () => {
        process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";
        resetRuntimeEnvCacheForTests();

        const response = await callApi({
            route: "/health",
            handler: healthHandler as any,
            headers: { origin: "https://blocked.example" },
        });

        assert.equal(response.status, 403);
        assert.equal(response.body.statusMessage, "Origin not allowed");
    });

    test("limits auth endpoints", async () => {
        process.env.RATE_LIMIT_WINDOW_MS = "60000";
        process.env.RATE_LIMIT_AUTH_MAX = "2";
        resetRuntimeEnvCacheForTests();

        const first = await callApi({
            route: "/auth/login",
            method: "POST",
            handler: loginHandler as any,
            body: { email: "bad", password: "" },
        });
        const second = await callApi({
            route: "/auth/login",
            method: "POST",
            handler: loginHandler as any,
            body: { email: "bad", password: "" },
        });
        const third = await callApi({
            route: "/auth/login",
            method: "POST",
            handler: loginHandler as any,
            body: { email: "bad", password: "" },
        });

        assert.equal(first.status, 400);
        assert.equal(second.status, 400);
        assert.equal(third.status, 429);
        assert.equal(third.body.statusMessage, "Too Many Requests");
    });

    test("limits checkout submit endpoint", async () => {
        process.env.RATE_LIMIT_WINDOW_MS = "60000";
        process.env.RATE_LIMIT_SUBMIT_MAX = "1";
        resetRuntimeEnvCacheForTests();

        const request = {
            route: "/checkout/submit",
            method: "POST" as const,
            handler: submitHandler as any,
            context: {
                auth: {
                    userId: "u1",
                    sessionId: "s1",
                    sessionVersion: 0,
                },
            },
            body: {
                orderRequestId: "o1",
                contactName: "John",
                contactPhone: "+100",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
            },
            useCases: {
                submitOrderRequest: {
                    async execute() {
                        return { orderRequest: { id: "o1", status: "sent" } };
                    },
                },
            },
        };

        const first = await callApi(request);
        const second = await callApi(request);

        assert.equal(first.status, 200);
        assert.equal(second.status, 429);
        assert.equal(second.body.statusMessage, "Too Many Requests");
    });
});
