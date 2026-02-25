import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import healthHandler from "~~/server/infrastructure/api/health.get";
import loginHandler from "~~/server/infrastructure/api/auth/login.post";
import submitHandler from "~~/server/infrastructure/api/checkout/submit.post";
import adminCardsHandler from "~~/server/infrastructure/api/admin/catalog/cards.get";
import adminCreateCardHandler from "~~/server/infrastructure/api/admin/catalog/cards.post";
import { resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";
import { resetSecurityStateForTests } from "~~/server/infrastructure/http/api/security";
import { callApi } from "./helpers";

describe("infra api security", () => {
    const originalAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;
    const originalWindow = process.env.RATE_LIMIT_WINDOW_MS;
    const originalAuthMax = process.env.RATE_LIMIT_AUTH_MAX;
    const originalSubmitMax = process.env.RATE_LIMIT_SUBMIT_MAX;
    const originalAdminUiEnabled = process.env.ADMIN_UI_ENABLED;
    const originalAdminWriteCsrfToken = process.env.ADMIN_WRITE_CSRF_TOKEN;

    beforeEach(() => {
        process.env.CORS_ALLOWED_ORIGINS = originalAllowedOrigins;
        process.env.RATE_LIMIT_WINDOW_MS = originalWindow;
        process.env.RATE_LIMIT_AUTH_MAX = originalAuthMax;
        process.env.RATE_LIMIT_SUBMIT_MAX = originalSubmitMax;
        process.env.ADMIN_UI_ENABLED = originalAdminUiEnabled;
        process.env.ADMIN_WRITE_CSRF_TOKEN = originalAdminWriteCsrfToken;
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
        assert.equal(response.headers["access-control-allow-credentials"], "true");
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

    test("blocks admin api when ADMIN_UI_ENABLED=false", async () => {
        process.env.ADMIN_UI_ENABLED = "false";
        resetRuntimeEnvCacheForTests();

        const response = await callApi({
            route: "/admin/catalog/cards",
            handler: adminCardsHandler as any,
            context: {
                auth: { userId: "admin-1" },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: "admin-1", status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(response.status, 404);
    });

    test("enforces admin csrf token for mutating admin endpoints when configured", async () => {
        process.env.ADMIN_UI_ENABLED = "true";
        process.env.ADMIN_WRITE_CSRF_TOKEN = "test-csrf";
        resetRuntimeEnvCacheForTests();

        const withoutToken = await callApi({
            route: "/admin/catalog/cards",
            method: "POST",
            handler: adminCreateCardHandler as any,
            body: {
                slug: "csrf-test",
                title: "csrf",
                type: "panel",
                description: "csrf",
                isActive: true,
            },
            context: {
                auth: { userId: "admin-1" },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: "admin-1", status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        const withToken = await callApi({
            route: "/admin/catalog/cards",
            method: "POST",
            handler: adminCreateCardHandler as any,
            body: {
                slug: "csrf-test-ok",
                title: "csrf",
                type: "panel",
                description: "csrf",
                isActive: true,
            },
            headers: {
                "x-admin-csrf": "test-csrf",
            },
            context: {
                auth: { userId: "admin-1" },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: "admin-1", status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(withoutToken.status, 403);
        assert.equal(withoutToken.body.statusMessage, "Invalid CSRF token");
        assert.notEqual(withToken.status, 403);
    });
});
