import { RepoResponse } from "~~/server/domain/base/types";
import { ProductType } from "~~/server/domain/product-card/types";
import { Currency, Pagination } from "~~/server/shared/types";

export interface GetCatalogPageQuery {
    execute(parameters: {
        pagination?: Pagination;
    }): Promise<RepoResponse<CatalogItem[], { pagination: Pagination; total: number }>>;
}

type CatalogItem = {
    cardId: string;
    slug: string;
    title: string;
    description: string;
    type: ProductType;

    minPrice: number;
    currency: Currency;

    colors: CatalogItemColor[];
};

type CatalogItemColor = {
    colorId: string;
    images: Array<{
        id: string;
        url: string;
    }>;
};
