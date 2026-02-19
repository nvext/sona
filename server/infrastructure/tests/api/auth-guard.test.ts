import { describe, test } from "node:test";
import assert from "node:assert/strict";
import addItemHandler from "~~/server/infrastructure/api/cart/items.post";
import { callApi } from "./helpers";

describe("infra api auth guard", () => {
    test("accepts cookie token with active session", async () => {
        let receivedInput: any = null;
        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            headers: { cookie: "access_token=token-1" },
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
                            if (!value) return null;
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

    test("rejects cookie token when session is revoked", async () => {
        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            headers: { cookie: "access_token=token-1" },
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
