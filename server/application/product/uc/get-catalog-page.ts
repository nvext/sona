import { Pagination } from "~~/server/shared/types";
import { GetCatalogPageQuery } from "../queries";

export class GetCatalogPage {
    constructor(private readonly getCatalogPageQuery: GetCatalogPageQuery) {}

    async execute(input: GetCatalogPageInput) {
        return this.getCatalogPageQuery.execute({ pagination: input.pagination });
    }
}

type GetCatalogPageInput = {
    pagination?: Pagination;
};
