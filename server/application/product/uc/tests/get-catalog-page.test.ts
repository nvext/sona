import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { GetCatalogPage } from "~~/server/application/product/uc/get-catalog-page";
import type { GetCatalogPageQuery } from "~~/server/application/product/queries";

describe("GetCatalogPage", () => {
    test("forwards pagination and returns query response", async () => {
        const pagination = { offset: 0, limit: 12 };
        let receivedPagination: { offset: number; limit: number } | undefined;

        const expected = {
            data: [],
            meta: {
                pagination,
                total: 0,
            },
        };

        const query = {
            async execute(input: { pagination?: { offset: number; limit: number } }) {
                receivedPagination = input.pagination;
                return expected;
            },
        } as unknown as GetCatalogPageQuery;

        const uc = new GetCatalogPage(query);
        const result = await uc.execute({ pagination });

        assert.deepEqual(receivedPagination, pagination);
        assert.deepEqual(result, expected);
    });
});
