import { describe, test } from "node:test";
import assert from "node:assert/strict";
import addItemHandler from "~~/server/infrastructure/api/cart/items.post";
import removeItemHandler from "~~/server/infrastructure/api/cart/items/[itemId].delete";
import createDraftHandler from "~~/server/infrastructure/api/checkout/drafts.post";
import submitHandler from "~~/server/infrastructure/api/checkout/submit.post";
import { NotFoundError } from "~~/server/shared/errors/NotFoundError";
import { callApi } from "./_helpers";

describe("infra cart/checkout api", () => {
    test("POST /cart/items adds item", async () => {
        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            body: { userId: "u1", productId: "p1", productColorId: "c1" },
            useCases: {
                addItemToCart: {
                    async execute() {
                        return { data: { id: "item-1" }, meta: undefined };
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.data.id, "item-1");
    });

    test("POST /cart/items returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            body: { userId: "", productId: "p1", productColorId: "c1" },
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
        assert.deepEqual(received, { itemId: "item-1" });
        assert.equal(response.body.deleted, true);
    });

    test("DELETE /cart/items/:itemId maps NotFoundError to 404", async () => {
        const response = await callApi({
            route: "/cart/items/:itemId",
            requestPath: "/cart/items/missing",
            method: "DELETE",
            handler: removeItemHandler as any,
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

    test("POST /checkout/drafts and /checkout/submit", async () => {
        const draftResponse = await callApi({
            route: "/checkout/drafts",
            method: "POST",
            handler: createDraftHandler as any,
            body: { cartId: "cart-1", idempotencyKey: "idem-1" },
            useCases: {
                createOrderRequestDraft: {
                    async execute() {
                        return { orderRequest: { id: "o1" }, snapshots: [] };
                    },
                },
            },
        });
        assert.equal(draftResponse.status, 200);
        assert.equal(draftResponse.body.orderRequest.id, "o1");

        const submitResponse = await callApi({
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
            useCases: {
                submitOrderRequest: {
                    async execute() {
                        return { orderRequest: { id: "o1", status: "submitted" } };
                    },
                },
            },
        });
        assert.equal(submitResponse.status, 200);
        assert.equal(submitResponse.body.orderRequest.status, "submitted");
    });

    test("POST /checkout/drafts returns 400 on invalid body", async () => {
        const response = await callApi({
            route: "/checkout/drafts",
            method: "POST",
            handler: createDraftHandler as any,
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
});
