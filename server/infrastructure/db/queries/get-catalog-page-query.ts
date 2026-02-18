import { and, eq, inArray } from "drizzle-orm";
import { GetCatalogPageQuery } from "~~/server/application/product/queries";
import { RepoResponse } from "~~/server/domain/base/types";
import { Pagination } from "~~/server/shared/types";
import { db } from "../connection";
import { productCards, productColors, products } from "../schema";

export class DbGetCatalogPageQuery implements GetCatalogPageQuery {
    async execute(parameters: {
        pagination?: Pagination;
    }): Promise<
        RepoResponse<
            Array<{
                cardId: string;
                slug: string;
                title: string;
                description: string;
                type: "panel";
                minPrice: number;
                currency: "RUB";
                colors: Array<{ colorId: string; previewImageId: string | null }>;
            }>,
            { pagination: Pagination; total: number }
        >
    > {
        const pagination = parameters.pagination ?? { offset: 0, limit: 24 };

        const cards = await db
            .select()
            .from(productCards)
            .where(eq(productCards.isActive, true))
            .limit(pagination.limit)
            .offset(pagination.offset);

        const totalRows = await db.$count(productCards, eq(productCards.isActive, true));

        if (cards.length === 0) {
            return {
                data: [],
                meta: { pagination, total: Number(totalRows) },
            };
        }

        const cardIds = cards.map((card) => card.id);

        const [priceRows, colorRows] = await Promise.all([
            db
                .select()
                .from(products)
                .where(and(eq(products.isActive, true), inArray(products.cardId, cardIds))),
            db
                .select()
                .from(productColors)
                .where(and(eq(productColors.isActive, true), inArray(productColors.productCardId, cardIds))),
        ]);

        const pricesByCard = new Map<string, number[]>();
        for (const row of priceRows) {
            const current = pricesByCard.get(row.cardId) ?? [];
            current.push(row.price);
            pricesByCard.set(row.cardId, current);
        }

        const colorsByCard = new Map<string, Array<{ colorId: string; previewImageId: string | null }>>();
        for (const row of colorRows) {
            const current = colorsByCard.get(row.productCardId) ?? [];
            current.push({
                colorId: row.id,
                previewImageId: row.imageIds[0] ?? null,
            });
            colorsByCard.set(row.productCardId, current);
        }

        const data = cards.map((card) => {
            const prices = pricesByCard.get(card.id) ?? [];
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

            return {
                cardId: card.id,
                slug: card.slug,
                title: card.title,
                description: card.description,
                type: card.type,
                minPrice,
                currency: "RUB" as const,
                colors: colorsByCard.get(card.id) ?? [],
            };
        });

        return {
            data,
            meta: {
                pagination,
                total: Number(totalRows),
            },
        };
    }
}
