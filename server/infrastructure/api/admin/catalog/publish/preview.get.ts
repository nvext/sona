import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { readValidatedQuery } from "~~/server/infrastructure/http/api/validation";
import { db } from "~~/server/infrastructure/db/connection";
import {
    catalogDrafts,
    filesStaging,
    productCardsStaging,
    productColorsStaging,
    productsStaging,
} from "~~/server/infrastructure/db/schema";

const previewQuerySchema = z.object({
    draftId: z.string().trim().min(1),
});

type OpCounts = {
    create: number;
    update: number;
    delete: number;
};

const EMPTY_COUNTS: OpCounts = {
    create: 0,
    update: 0,
    delete: 0,
};

export default defineApiHandler(async (event) => {
    await requireAdmin(event);
    const query = readValidatedQuery(event, previewQuerySchema);

    const [draft] = await db
        .select()
        .from(catalogDrafts)
        .where(and(eq(catalogDrafts.id, query.draftId), eq(catalogDrafts.status, "open")))
        .limit(1);

    if (!draft) {
        return {
            draftId: query.draftId,
            exists: false,
            summary: {
                productCards: EMPTY_COUNTS,
                productColors: EMPTY_COUNTS,
                products: EMPTY_COUNTS,
                files: EMPTY_COUNTS,
            },
        };
    }

    const [cards, colors, prods, files] = await Promise.all([
        getCounts(productCardsStaging, query.draftId),
        getCounts(productColorsStaging, query.draftId),
        getCounts(productsStaging, query.draftId),
        getCounts(filesStaging, query.draftId),
    ]);

    return {
        draftId: query.draftId,
        exists: true,
        status: draft.status,
        updatedAt: draft.updatedAt,
        summary: {
            productCards: cards,
            productColors: colors,
            products: prods,
            files,
        },
    };
});

async function getCounts(
    table: typeof productCardsStaging | typeof productColorsStaging | typeof productsStaging | typeof filesStaging,
    draftId: string,
): Promise<OpCounts> {
    const rows = await db
        .select({
            op: table.op,
            count: sql<number>`count(*)`,
        })
        .from(table)
        .where(eq(table.draftId, draftId))
        .groupBy(table.op);

    const mapped = {
        create: 0,
        update: 0,
        delete: 0,
    };

    for (const row of rows) {
        if (row.op === "create" || row.op === "update" || row.op === "delete") {
            mapped[row.op] = row.count;
        }
    }

    return mapped;
}
