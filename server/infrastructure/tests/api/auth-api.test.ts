import { describe, test } from "node:test";
import assert from "node:assert/strict";
import registerHandler from "~~/server/infrastructure/api/auth/register.post";
import loginHandler from "~~/server/infrastructure/api/auth/login.post";
import refreshHandler from "~~/server/infrastructure/api/auth/refresh.post";
import logoutHandler from "~~/server/infrastructure/api/auth/logout.post";
import meGetHandler from "~~/server/infrastructure/api/auth/me.get";
import mePatchHandler from "~~/server/infrastructure/api/auth/me.patch";
import registerConfirmHandler from "~~/server/infrastructure/api/auth/register/confirm.post";
import registerResendHandler from "~~/server/infrastructure/api/auth/register/resend.post";
import verificationRequestHandler from "~~/server/infrastructure/api/auth/verification/request.post";
import verificationConfirmHandler from "~~/server/infrastructure/api/auth/verification/confirm.post";
import { InvalidCredentialsError } from "~~/server/shared/errors/InvalidCredentialsError";
import { ConflictError } from "~~/server/shared/errors/ConflictError";
import { ContactNotVerifiedError } from "~~/server/shared/errors/ContactNotVerifiedError";
import { callApi } from "./helpers";

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
                                name: null,
                                email: "user@example.com",
                                phone: null,
                                emailVerifiedAt: null,
                                phoneVerifiedAt: null,
                                emailVerificationCodeHash: null,
                                emailVerificationExpiresAt: null,
                                emailVerificationRequestedAt: null,
                                phoneVerificationCodeHash: null,
                                phoneVerificationExpiresAt: null,
                                phoneVerificationRequestedAt: null,
                                status: "active",
                                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                                updatedAt: null,
                                sessionVersion: 0,
                                passwordHash: "hidden",
                            },
                        };
                    },
                },
                requestContactVerification: {
                    async execute() {
                        return {
                            channel: "email",
                            expiresAt: new Date("2026-02-22T10:00:00.000Z"),
                            retryAfterMs: 60000,
                        };
                    },
                },
            },
            body: { email: "user@example.com", password: "secret123" },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.user.id, "user-1");
        assert.equal(response.body.user.passwordHash, undefined);
        assert.equal(response.body.user.emailVerified, false);
        assert.equal(response.body.user.phoneVerified, false);
        assert.equal(response.body.verification.required, true);
        assert.equal(response.body.verification.channel, "email");
        const setCookie = response.headers["set-cookie"];
        assert.ok(Array.isArray(setCookie));
        assert.equal(setCookie.length, 0);
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

    test("POST /auth/register/confirm confirms contact and sets auth cookies", async () => {
        let confirmInput: any = null;
        let loginInput: any = null;
        const response = await callApi({
            route: "/auth/register/confirm",
            method: "POST",
            handler: registerConfirmHandler as any,
            useCases: {
                confirmContactVerification: {
                    async execute(input: any) {
                        confirmInput = input;
                        return {
                            channel: "email",
                            verifiedAt: new Date("2026-02-22T10:00:00.000Z"),
                            user: {
                                id: "user-1",
                                name: null,
                                email: "user@example.com",
                                phone: null,
                                emailVerifiedAt: new Date("2026-02-22T10:00:00.000Z"),
                                phoneVerifiedAt: null,
                                emailVerificationCodeHash: null,
                                emailVerificationExpiresAt: null,
                                emailVerificationRequestedAt: null,
                                phoneVerificationCodeHash: null,
                                phoneVerificationExpiresAt: null,
                                phoneVerificationRequestedAt: null,
                                status: "active",
                                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                                updatedAt: null,
                                sessionVersion: 0,
                                passwordHash: "hash",
                            },
                        };
                    },
                },
                login: {
                    async execute(input: any) {
                        loginInput = input;
                        return { accessToken: "a", refreshToken: "r" };
                    },
                },
            },
            container: {
                repos: {
                    userRepo: {
                        async getByEmail() {
                            return {
                                data: {
                                    id: "user-1",
                                    status: "active",
                                    passwordHash: "hash",
                                },
                                meta: undefined,
                            };
                        },
                    },
                },
                services: {
                    passwordHasher: {
                        async verify() {
                            return true;
                        },
                    },
                },
            },
            body: {
                email: "user@example.com",
                password: "secret123",
                code: "123456",
            },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.ok, true);
        assert.equal(response.body.user.emailVerified, true);
        assert.deepEqual(confirmInput, {
            userId: "user-1",
            channel: "email",
            code: "123456",
        });
        assert.deepEqual(loginInput, {
            email: "user@example.com",
            password: "secret123",
        });
        assert.ok(response.headers["set-cookie"]);
    });

    test("POST /auth/register/resend delegates to request verification", async () => {
        let requestInput: any = null;
        const response = await callApi({
            route: "/auth/register/resend",
            method: "POST",
            handler: registerResendHandler as any,
            useCases: {
                requestContactVerification: {
                    async execute(input: any) {
                        requestInput = input;
                        return {
                            channel: "phone",
                            expiresAt: new Date("2026-02-22T10:00:00.000Z"),
                            retryAfterMs: 60000,
                        };
                    },
                },
            },
            container: {
                repos: {
                    userRepo: {
                        async getByPhone() {
                            return {
                                data: {
                                    id: "user-1",
                                    status: "active",
                                    passwordHash: "hash",
                                },
                                meta: undefined,
                            };
                        },
                    },
                },
                services: {
                    passwordHasher: {
                        async verify() {
                            return true;
                        },
                    },
                },
            },
            body: {
                phone: "+10000000000",
                password: "secret123",
            },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.ok, true);
        assert.equal(response.body.channel, "phone");
        assert.deepEqual(requestInput, {
            userId: "user-1",
            channel: "phone",
        });
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
        assert.equal(response.body.ok, true);
        assert.ok(response.headers["set-cookie"]);
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

    test("POST /auth/login returns 403 when contact is not verified", async () => {
        const response = await callApi({
            route: "/auth/login",
            method: "POST",
            handler: loginHandler as any,
            useCases: {
                login: {
                    async execute() {
                        throw new ContactNotVerifiedError("Email is not verified");
                    },
                },
            },
            body: { email: "user@example.com", password: "secret123" },
        });

        assert.equal(response.status, 403);
        assert.equal(response.body.statusMessage, "Email is not verified");
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
        assert.equal(refreshResponse.body.ok, true);
        assert.ok(refreshResponse.headers["set-cookie"]);

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
            context: {
                auth: {
                    userId: "u1",
                    sessionId: "s1",
                    sessionVersion: 0,
                },
            },
        });

        assert.equal(logoutResponse.status, 200);
        assert.equal(logoutResponse.body.revoked, true);
    });

    test("POST /auth/refresh returns ok=false when token is missing", async () => {
        const response = await callApi({
            route: "/auth/refresh",
            method: "POST",
            handler: refreshHandler as any,
            body: { refreshToken: "" },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.ok, false);
    });

    test("POST /auth/logout returns 401 when unauthorized", async () => {
        const response = await callApi({
            route: "/auth/logout",
            method: "POST",
            handler: logoutHandler as any,
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Unauthorized");
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

    test("GET /auth/me returns user payload", async () => {
        const response = await callApi({
            route: "/auth/me",
            method: "GET",
            handler: meGetHandler as any,
            context: {
                auth: {
                    userId: "u1",
                    sessionId: "s1",
                    sessionVersion: 0,
                },
            },
            container: {
                repos: {
                    userRepo: {
                        async getById() {
                            return {
                                data: {
                                    id: "u1",
                                    name: "Иван",
                                    email: "user@example.com",
                                    phone: "+10000000000",
                                    emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
                                    phoneVerifiedAt: null,
                                    emailVerificationCodeHash: null,
                                    emailVerificationExpiresAt: null,
                                    emailVerificationRequestedAt: null,
                                    phoneVerificationCodeHash: null,
                                    phoneVerificationExpiresAt: null,
                                    phoneVerificationRequestedAt: null,
                                    status: "active",
                                    passwordHash: "hash",
                                    createdAt: new Date("2026-01-01T00:00:00.000Z"),
                                    updatedAt: null,
                                    sessionVersion: 0,
                                },
                                meta: undefined,
                            };
                        },
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.user.id, "u1");
        assert.equal(response.body.user.name, "Иван");
        assert.equal(response.body.user.email, "user@example.com");
        assert.equal(response.body.user.phone, "+10000000000");
        assert.equal(response.body.user.emailVerified, true);
        assert.equal(response.body.user.phoneVerified, false);
    });

    test("PATCH /auth/me updates profile", async () => {
        let received: any = null;
        const response = await callApi({
            route: "/auth/me",
            method: "PATCH",
            handler: mePatchHandler as any,
            context: {
                auth: {
                    userId: "u1",
                    sessionId: "s1",
                    sessionVersion: 0,
                },
            },
            useCases: {
                updateProfile: {
                    async execute(input: any) {
                        received = input;
                        return {
                            user: {
                                id: "u1",
                                name: "Иван Петров",
                                email: "new@example.com",
                                phone: "+10000000000",
                                emailVerifiedAt: null,
                                phoneVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
                                emailVerificationCodeHash: null,
                                emailVerificationExpiresAt: null,
                                emailVerificationRequestedAt: null,
                                phoneVerificationCodeHash: null,
                                phoneVerificationExpiresAt: null,
                                phoneVerificationRequestedAt: null,
                                status: "active",
                                passwordHash: "hash",
                                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                                updatedAt: null,
                                sessionVersion: 0,
                            },
                        };
                    },
                },
            },
            body: { name: "Иван Петров", email: "new@example.com" },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(received, {
            userId: "u1",
            name: "Иван Петров",
            email: "new@example.com",
            phone: undefined,
        });
        assert.equal(response.body.user.name, "Иван Петров");
        assert.equal(response.body.user.email, "new@example.com");
        assert.equal(response.body.user.emailVerified, false);
        assert.equal(response.body.user.phoneVerified, true);
    });

    test("PATCH /auth/me returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/auth/me",
            method: "PATCH",
            handler: mePatchHandler as any,
            context: {
                auth: {
                    userId: "u1",
                    sessionId: "s1",
                    sessionVersion: 0,
                },
            },
            body: {},
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("PATCH /auth/me maps conflict to 409", async () => {
        const response = await callApi({
            route: "/auth/me",
            method: "PATCH",
            handler: mePatchHandler as any,
            context: {
                auth: {
                    userId: "u1",
                    sessionId: "s1",
                    sessionVersion: 0,
                },
            },
            useCases: {
                updateProfile: {
                    async execute() {
                        throw new ConflictError("Email already in use");
                    },
                },
            },
            body: { email: "taken@example.com" },
        });

        assert.equal(response.status, 409);
        assert.equal(response.body.statusMessage, "Email already in use");
    });

    test("POST /auth/verification/request delegates to use case", async () => {
        let received: any = null;

        const response = await callApi({
            route: "/auth/verification/request",
            method: "POST",
            handler: verificationRequestHandler as any,
            context: {
                auth: {
                    userId: "u1",
                    sessionId: "s1",
                    sessionVersion: 0,
                },
            },
            useCases: {
                requestContactVerification: {
                    async execute(input: any) {
                        received = input;
                        return {
                            channel: "email",
                            expiresAt: new Date("2026-02-21T10:00:00.000Z"),
                            retryAfterMs: 60000,
                        };
                    },
                },
            },
            body: { channel: "email" },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(received, { userId: "u1", channel: "email" });
        assert.equal(response.body.ok, true);
        assert.equal(response.body.channel, "email");
        assert.equal(response.body.retryAfterMs, 60000);
    });

    test("POST /auth/verification/confirm updates user payload", async () => {
        let received: any = null;

        const response = await callApi({
            route: "/auth/verification/confirm",
            method: "POST",
            handler: verificationConfirmHandler as any,
            context: {
                auth: {
                    userId: "u1",
                    sessionId: "s1",
                    sessionVersion: 0,
                },
            },
            useCases: {
                confirmContactVerification: {
                    async execute(input: any) {
                        received = input;
                        return {
                            channel: "phone",
                            verifiedAt: new Date("2026-02-21T10:00:00.000Z"),
                            user: {
                                id: "u1",
                                name: "Иван",
                                email: "user@example.com",
                                phone: "+10000000000",
                                emailVerifiedAt: null,
                                phoneVerifiedAt: new Date("2026-02-21T10:00:00.000Z"),
                                emailVerificationCodeHash: null,
                                emailVerificationExpiresAt: null,
                                emailVerificationRequestedAt: null,
                                phoneVerificationCodeHash: null,
                                phoneVerificationExpiresAt: null,
                                phoneVerificationRequestedAt: null,
                                passwordHash: "hash",
                                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                                updatedAt: null,
                                sessionVersion: 0,
                                status: "active",
                            },
                        };
                    },
                },
            },
            body: { channel: "phone", code: "123456" },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(received, {
            userId: "u1",
            channel: "phone",
            code: "123456",
        });
        assert.equal(response.body.ok, true);
        assert.equal(response.body.user.phoneVerified, true);
        assert.equal(response.body.user.emailVerified, false);
    });

    test("POST /auth/register/confirm returns 401 on invalid credentials", async () => {
        const response = await callApi({
            route: "/auth/register/confirm",
            method: "POST",
            handler: registerConfirmHandler as any,
            container: {
                repos: {
                    userRepo: {
                        async getByEmail() {
                            return { data: null, meta: undefined };
                        },
                    },
                },
                services: {
                    passwordHasher: {
                        async verify() {
                            return false;
                        },
                    },
                },
            },
            body: {
                email: "user@example.com",
                password: "secret123",
                code: "123456",
            },
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Invalid credentials");
    });

    test("PATCH /auth/me returns 401 when unauthorized", async () => {
        const response = await callApi({
            route: "/auth/me",
            method: "PATCH",
            handler: mePatchHandler as any,
            body: { email: "new@example.com" },
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Unauthorized");
    });

    test("POST /auth/verification/request returns 401 when unauthorized", async () => {
        const response = await callApi({
            route: "/auth/verification/request",
            method: "POST",
            handler: verificationRequestHandler as any,
            body: { channel: "email" },
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Unauthorized");
    });
});
