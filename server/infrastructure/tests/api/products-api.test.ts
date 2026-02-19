import { describe, test } from "node:test";
import assert from "node:assert/strict";
import catalogHandler from "~~/server/infrastructure/api/products/catalog.get";
import productCardHandler from "~~/server/infrastructure/api/products/[cardId].get";
import { NotFoundError } from "~~/server/shared/errors/NotFoundError";
import { callApi } from "./helpers";

describe("infra products api", () => {
    test("GET /products/catalog parses pagination", async () => {
        let received: any = null;
        const response = await callApi({
            route: "/products/catalog",
            handler: catalogHandler as any,
            query: { offset: 5, limit: 10 },
            useCases: {
                getCatalogPage: {
                    async execute(input: any) {
                        received = input;
                        return { data: [], meta: { pagination: input.pagination, total: 0 } };
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(received, { pagination: { offset: 5, limit: 10 } });
    });

    test("GET /products/catalog passes undefined pagination when query is empty", async () => {
        let received: any = null;
        const response = await callApi({
            route: "/products/catalog",
            handler: catalogHandler as any,
            useCases: {
                getCatalogPage: {
                    async execute(input: any) {
                        received = input;
                        return { data: [], meta: { pagination: undefined, total: 0 } };
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(received, { pagination: undefined });
    });

    test("GET /products/catalog returns 400 on invalid query", async () => {
        const response = await callApi({
            route: "/products/catalog",
            handler: catalogHandler as any,
            query: { limit: 0 },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.statusMessage, "Validation failed");
    });

    test("GET /products/:cardId delegates cardId to use case", async () => {
        let received: any = null;
        const response = await callApi({
            route: "/products/:cardId",
            requestPath: "/products/card-1",
            handler: productCardHandler as any,
            useCases: {
                getProductCardDetails: {
                    async execute(input: any) {
                        received = input;
                        return { card: { id: "card-1" }, skuRows: [] };
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(received, { cardId: "card-1" });
    });

    test("GET /products/:cardId maps NotFoundError to 404", async () => {
        const response = await callApi({
            route: "/products/:cardId",
            requestPath: "/products/missing-card",
            handler: productCardHandler as any,
            useCases: {
                getProductCardDetails: {
                    async execute() {
                        throw new NotFoundError("Product card not found");
                    },
                },
            },
        });

        assert.equal(response.status, 404);
        assert.equal(response.body.statusMessage, "Product card not found");
    });
});
