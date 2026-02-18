import { describe, test } from "node:test";
import assert from "node:assert/strict";
import addItemHandler from "~~/server/infrastructure/api/cart/items.post";
import { HmacAccessTokenIssuer } from "~~/server/infrastructure/services/token/HmacAccessTokenIssuer";
import { callApi } from "./_helpers";

const issuer = new HmacAccessTokenIssuer({
    secret: "test-access-secret",
    ttlMs: 60_000,
});

describe("infra api auth guard", () => {
    test("accepts valid bearer token with active session", async () => {
        const token = issuer.issue({
            userId: "user-1",
            sessionId: "session-1",
            sessionVersion: 2,
        });

        let receivedInput: any = null;
        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            headers: { authorization: `Bearer ${token}` },
            body: { productId: "p1", productColorId: "c1" },
            useCases: {
                addItemToCart: {
                    async execute(input: any) {
                        receivedInput = input;
                        return { data: { id: "item-1" }, meta: undefined };
                    },
                },
            },
            container: {
                repos: {
                    sessionRepo: {
                        async getById() {
                            return {
                                data: {
                                    id: "session-1",
                                    userId: "user-1",
                                    version: 2,
                                    revokedAt: null,
                                    expiresAt: new Date(Date.now() + 60_000),
                                },
                                meta: undefined,
                            };
                        },
                    },
                },
                services: {
                    accessTokenVerifier: {
                        verify(value: string) {
                            const [payload, signature] = value.split(".");
                            if (!payload || !signature) {
                                return null;
                            }
                            return {
                                userId: "user-1",
                                sessionId: "session-1",
                                sessionVersion: 2,
                            };
                        },
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(receivedInput, { userId: "user-1", productId: "p1", productColorId: "c1" });
    });

    test("rejects bearer token when session is revoked", async () => {
        const token = issuer.issue({
            userId: "user-1",
            sessionId: "session-1",
            sessionVersion: 2,
        });

        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            headers: { authorization: `Bearer ${token}` },
            body: { productId: "p1", productColorId: "c1" },
            useCases: {
                addItemToCart: {
                    async execute() {
                        return { data: { id: "item-1" }, meta: undefined };
                    },
                },
            },
            container: {
                repos: {
                    sessionRepo: {
                        async getById() {
                            return {
                                data: {
                                    id: "session-1",
                                    userId: "user-1",
                                    version: 2,
                                    revokedAt: new Date(),
                                    expiresAt: new Date(Date.now() + 60_000),
                                },
                                meta: undefined,
                            };
                        },
                    },
                },
                services: {
                    accessTokenVerifier: {
                        verify() {
                            return {
                                userId: "user-1",
                                sessionId: "session-1",
                                sessionVersion: 2,
                            };
                        },
                    },
                },
            },
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Unauthorized");
    });
});
