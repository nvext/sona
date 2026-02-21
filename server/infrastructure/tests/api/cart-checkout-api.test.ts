import { describe, test } from "node:test";
import assert from "node:assert/strict";
import getItemsHandler from "~~/server/infrastructure/api/cart/items.get";
import addItemHandler from "~~/server/infrastructure/api/cart/items.post";
import removeItemHandler from "~~/server/infrastructure/api/cart/items/[itemId].delete";
import createDraftHandler from "~~/server/infrastructure/api/checkout/drafts.post";
import submitHandler from "~~/server/infrastructure/api/checkout/submit.post";
import { NotFoundError } from "~~/server/shared/errors/NotFoundError";
import { callApi } from "./helpers";

const authContext = {
    auth: {
        userId: "u1",
        sessionId: "s1",
        sessionVersion: 0,
    },
};

describe("infra cart/checkout api", () => {
    test("GET /cart/items returns items", async () => {
        const response = await callApi({
            route: "/cart/items",
            handler: getItemsHandler as any,
            context: authContext,
            useCases: {
                getCartItems: {
                    async execute() {
                        return {
                            data: [
                                {
                                    id: "item-1",
                                    productId: "p1",
                                    productColorId: "c1",
                                    title: "Panel",
                                    colorName: "Black",
                                    colorHex: "#000",
                                    width: 60,
                                    height: 120,
                                    thickness: 25,
                                    price: 3000,
                                    currency: "RUB",
                                    imageUrl: "/img.png",
                                    quantity: 2,
                                },
                            ],
                            meta: { cartId: "cart-1" },
                        };
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.data.length, 1);
        assert.equal(response.body.data[0].id, "item-1");
        assert.equal(response.body.meta.cartId, "cart-1");
    });

    test("GET /cart/items returns 401 when unauthorized", async () => {
        const response = await callApi({
            route: "/cart/items",
            handler: getItemsHandler as any,
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Unauthorized");
    });

    test("POST /cart/items adds item", async () => {
        let received: any = null;
        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            context: authContext,
            body: { productId: "p1", productColorId: "c1", quantity: 4 },
            useCases: {
                addItemToCart: {
                    async execute(input: any) {
                        received = input;
                        return { data: { id: "item-1" }, meta: undefined };
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.data.id, "item-1");
        assert.deepEqual(received, { userId: "u1", productId: "p1", productColorId: "c1", quantity: 4 });
    });

    test("POST /cart/items returns 401 when unauthorized", async () => {
        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            body: { productId: "p1", productColorId: "c1" },
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Unauthorized");
    });

    test("POST /cart/items returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            context: authContext,
            body: { productId: "p1", productColorId: "" },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("POST /cart/items returns 400 on invalid quantity", async () => {
        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            context: authContext,
            body: { productId: "p1", productColorId: "c1", quantity: 0 },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("DELETE /cart/items/:itemId removes item", async () => {
        let received: any = null;
        const response = await callApi({
            route: "/cart/items/:itemId",
            requestPath: "/cart/items/item-1",
            method: "DELETE",
            handler: removeItemHandler as any,
            context: authContext,
            useCases: {
                removeItemFromCart: {
                    async execute(input: any) {
                        received = input;
                        return { deleted: true };
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(received, { itemId: "item-1", userId: "u1" });
        assert.equal(response.body.deleted, true);
    });

    test("DELETE /cart/items/:itemId maps NotFoundError to 404", async () => {
        const response = await callApi({
            route: "/cart/items/:itemId",
            requestPath: "/cart/items/missing",
            method: "DELETE",
            handler: removeItemHandler as any,
            context: authContext,
            useCases: {
                removeItemFromCart: {
                    async execute() {
                        throw new NotFoundError("Cart item not found");
                    },
                },
            },
        });

        assert.equal(response.status, 404);
        assert.equal(response.body.statusMessage, "Cart item not found");
    });

    test("DELETE /cart/items/:itemId returns 401 when unauthorized", async () => {
        const response = await callApi({
            route: "/cart/items/:itemId",
            requestPath: "/cart/items/item-1",
            method: "DELETE",
            handler: removeItemHandler as any,
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Unauthorized");
    });

    test("POST /checkout/drafts and /checkout/submit", async () => {
        let draftInput: any = null;
        const draftResponse = await callApi({
            route: "/checkout/drafts",
            method: "POST",
            handler: createDraftHandler as any,
            context: authContext,
            body: { cartId: "cart-1", idempotencyKey: "idem-1" },
            useCases: {
                createOrderRequestDraft: {
                    async execute(input: any) {
                        draftInput = input;
                        return { orderRequest: { id: "o1" }, snapshots: [] };
                    },
                },
            },
        });
        assert.equal(draftResponse.status, 200);
        assert.equal(draftResponse.body.orderRequest.id, "o1");
        assert.deepEqual(draftInput, {
            cartId: "cart-1",
            idempotencyKey: "idem-1",
            userId: "u1",
        });

        let submitInput: any = null;
        const submitResponse = await callApi({
            route: "/checkout/submit",
            method: "POST",
            handler: submitHandler as any,
            context: authContext,
            body: {
                orderRequestId: "o1",
                contactName: "John",
                contactPhone: "+100",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
            },
            useCases: {
                submitOrderRequest: {
                    async execute(input: any) {
                        submitInput = input;
                        return { orderRequest: { id: "o1", status: "submitted" } };
                    },
                },
            },
        });
        assert.equal(submitResponse.status, 200);
        assert.equal(submitResponse.body.orderRequest.status, "submitted");
        assert.deepEqual(submitInput, {
            orderRequestId: "o1",
            contactName: "John",
            contactPhone: "+100",
            contactEmail: "john@example.com",
            contactTelegram: "@john",
            userId: "u1",
        });
    });

    test("POST /checkout/drafts returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/checkout/drafts",
            method: "POST",
            handler: createDraftHandler as any,
            context: authContext,
            body: { cartId: "", idempotencyKey: "" },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("POST /checkout/submit returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/checkout/submit",
            method: "POST",
            handler: submitHandler as any,
            context: authContext,
            body: {
                orderRequestId: "o1",
                contactName: null,
                contactPhone: "",
                contactEmail: "bad-email",
                contactTelegram: null,
            },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("POST /checkout/submit returns 401 when unauthorized", async () => {
        const response = await callApi({
            route: "/checkout/submit",
            method: "POST",
            handler: submitHandler as any,
            body: {
                orderRequestId: "o1",
                contactName: "John",
                contactPhone: "+100",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
            },
        });

        assert.equal(response.status, 401);
        assert.equal(response.body.statusMessage, "Unauthorized");
    });

});
