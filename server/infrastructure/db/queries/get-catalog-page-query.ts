import { and, eq, inArray } from "drizzle-orm";
import { GetCatalogPageQuery } from "~~/server/application/product/queries";
import { RepoResponse } from "~~/server/domain/base/types";
import { Pagination } from "~~/server/shared/types";
import { db } from "../connection";
import { files, productCards, productColors, products } from "../schema";

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
                colors: Array<{ colorId: string; hex: string; images: Array<{ id: string; url: string }> }>;
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

        const imageIds = Array.from(new Set(colorRows.flatMap((row) => row.imageIds)));
        const fileRows =
            imageIds.length === 0
                ? []
                : await db.select({ id: files.id, url: files.url }).from(files).where(inArray(files.id, imageIds));
        const filesById = new Map(fileRows.map((row) => [row.id, row]));

        const pricesByCard = new Map<string, number[]>();
        for (const row of priceRows) {
            const current = pricesByCard.get(row.cardId) ?? [];
            current.push(row.price);
            pricesByCard.set(row.cardId, current);
        }

        const colorsByCard = new Map<
            string,
            Array<{ colorId: string; hex: string; images: Array<{ id: string; url: string }> }>
        >();
        for (const row of colorRows) {
            const current = colorsByCard.get(row.productCardId) ?? [];
            current.push({
                colorId: row.id,
                hex: row.hex,
                images: row.imageIds.flatMap((imageId) => {
                    const file = filesById.get(imageId);
                    return file ? [{ id: file.id, url: file.url }] : [];
                }),
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
