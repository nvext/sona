import { describe, test } from "node:test";
import assert from "node:assert/strict";
import registerHandler from "~~/server/infrastructure/api/auth/register.post";
import loginHandler from "~~/server/infrastructure/api/auth/login.post";
import refreshHandler from "~~/server/infrastructure/api/auth/refresh.post";
import logoutHandler from "~~/server/infrastructure/api/auth/logout.post";
import { InvalidCredentialsError } from "~~/server/shared/errors/InvalidCredentialsError";
import { callApi } from "./_helpers";

describe("infra auth api", () => {
    test("POST /auth/register returns sanitized user", async () => {
        const response = await callApi({
            route: "/auth/register",
            method: "POST",
            handler: registerHandler as any,
            useCases: {
                register: {
                    async execute() {
                        return {
                            user: {
                                id: "user-1",
                                email: "user@example.com",
                                phone: null,
                                status: "active",
                                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                                passwordHash: "hidden",
                            },
                        };
                    },
                },
            },
            body: { email: "user@example.com", password: "secret123" },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.user.id, "user-1");
        assert.equal(response.body.user.passwordHash, undefined);
    });

    test("POST /auth/register returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/auth/register",
            method: "POST",
            handler: registerHandler as any,
            body: { email: "bad-email", password: "123" },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("POST /auth/login delegates to use case", async () => {
        const response = await callApi({
            route: "/auth/login",
            method: "POST",
            handler: loginHandler as any,
            useCases: {
                login: {
                    async execute() {
                        return { accessToken: "a", refreshToken: "r" };
                    },
                },
            },
            body: { email: "user@example.com", password: "secret123" },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.accessToken, "a");
        assert.equal(response.body.refreshToken, "r");
    });

    test("POST /auth/login returns 401 on invalid credentials", async () => {
        const response = await callApi({
            route: "/auth/login",
            method: "POST",
            handler: loginHandler as any,
            useCases: {
                login: {
                    async execute() {
                        throw new InvalidCredentialsError();
                    },
                },
            },
            body: { email: "user@example.com", password: "secret123" },
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Invalid credentials");
    });

    test("POST /auth/login returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/auth/login",
            method: "POST",
            handler: loginHandler as any,
            body: { email: "bad", password: "" },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("POST /auth/refresh and /auth/logout", async () => {
        const refreshResponse = await callApi({
            route: "/auth/refresh",
            method: "POST",
            handler: refreshHandler as any,
            useCases: {
                refresh: {
                    async execute() {
                        return { accessToken: "a2", refreshToken: "r2" };
                    },
                },
            },
            body: { refreshToken: "r" },
        });

        assert.equal(refreshResponse.status, 200);
        assert.equal(refreshResponse.body.accessToken, "a2");

        const logoutResponse = await callApi({
            route: "/auth/logout",
            method: "POST",
            handler: logoutHandler as any,
            useCases: {
                logout: {
                    async execute() {
                        return { revoked: true };
                    },
                },
            },
            body: { sessionId: "s1" },
        });

        assert.equal(logoutResponse.status, 200);
        assert.equal(logoutResponse.body.revoked, true);
    });

    test("POST /auth/refresh returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/auth/refresh",
            method: "POST",
            handler: refreshHandler as any,
            body: { refreshToken: "" },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("POST /auth/logout returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/auth/logout",
            method: "POST",
            handler: logoutHandler as any,
            body: { sessionId: "" },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("POST /auth/refresh returns 500 on unknown error", async () => {
        const response = await callApi({
            route: "/auth/refresh",
            method: "POST",
            handler: refreshHandler as any,
            useCases: {
                refresh: {
                    async execute() {
                        throw new Error("boom");
                    },
                },
            },
            body: { refreshToken: "r" },
        });

        assert.equal(response.status, 500);
        assert.equal(response.body.statusMessage, "Internal Server Error");
    });
});
