import { describe, test } from "node:test";
import assert from "node:assert/strict";
import healthHandler from "~~/server/infrastructure/api/health.get";
import readyHandler from "~~/server/infrastructure/api/ready.get";
import metricsHandler from "~~/server/infrastructure/api/metrics.get";
import { callApi } from "./helpers";

describe("infra system api", () => {
    test("GET /health returns ok", async () => {
        const response = await callApi({
            route: "/health",
            handler: healthHandler as any,
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.status, "ok");
        assert.equal(typeof response.body.timestamp, "string");
    });

    test("GET /ready returns ready when db ping succeeds", async () => {
        const response = await callApi({
            route: "/ready",
            handler: readyHandler as any,
            context: {
                async databaseReady() {
                    return;
                },
            },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.status, "ready");
        assert.equal(response.body.database, "ok");
    });

    test("GET /ready returns 503 when db ping fails", async () => {
        const response = await callApi({
            route: "/ready",
            handler: readyHandler as any,
            context: {
                async databaseReady() {
                    throw new Error("db down");
                },
            },
        });

        assert.equal(response.status, 503);
        assert.equal(response.body.statusMessage, "Service Unavailable");
    });

    test("GET /metrics returns delivery metrics", async () => {
        const response = await callApi({
            route: "/metrics",
            handler: metricsHandler as any,
        });

        assert.equal(response.status, 200);
        assert.ok(String(response.body.raw).includes("sona_delivery_submit_attempts_total"));
        assert.ok(String(response.body.raw).includes("sona_delivery_retry_cycles_total"));
        assert.ok(String(response.body.raw).includes("sona_admin_publish_total"));
    });
});
