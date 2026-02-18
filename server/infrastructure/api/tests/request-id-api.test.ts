import { describe, test } from "node:test";
import assert from "node:assert/strict";
import healthHandler from "~~/server/infrastructure/api/health.get";
import loginHandler from "~~/server/infrastructure/api/auth/login.post";
import { callApi } from "./_helpers";

describe("infra request-id api", () => {
    test("sets x-request-id header when absent", async () => {
        const response = await callApi({
            route: "/health",
            handler: healthHandler as any,
        });

        assert.equal(response.status, 200);
        assert.equal(typeof response.headers["x-request-id"], "string");
        assert.ok(response.headers["x-request-id"].length > 0);
    });

    test("reuses incoming x-request-id", async () => {
        const response = await callApi({
            route: "/health",
            handler: healthHandler as any,
            headers: {
                "x-request-id": "req-123",
            },
        });

        assert.equal(response.status, 200);
        assert.equal(response.headers["x-request-id"], "req-123");
    });

    test("includes x-request-id on error response", async () => {
        const response = await callApi({
            route: "/auth/login",
            method: "POST",
            handler: loginHandler as any,
            body: { email: "bad", password: "" },
        });

        assert.equal(response.status, 400);
        assert.equal(typeof response.headers["x-request-id"], "string");
        assert.ok(response.headers["x-request-id"].length > 0);
    });
});
