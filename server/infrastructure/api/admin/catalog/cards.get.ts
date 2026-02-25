import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { readValidatedQuery } from "~~/server/infrastructure/http/api/validation";
import { db } from "~~/server/infrastructure/db/connection";
import { productCards, productCardsStaging } from "~~/server/infrastructure/db/schema";

const cardsQuerySchema = z.object({
    query: z.string().trim().optional(),
    status: z.enum(["active", "inactive", "all"]).default("all"),
    draftId: z.string().trim().optional(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});

export default defineApiHandler(async (event) => {
    await requireAdmin(event);
    const input = readValidatedQuery(event, cardsQuerySchema);

    const filters = [];

    if (input.status === "active") {
        filters.push(eq(productCards.isActive, true));
    } else if (input.status === "inactive") {
        filters.push(eq(productCards.isActive, false));
    }

    if (input.query && input.query.length > 0) {
        filters.push(
            or(
                ilike(productCards.title, `%${input.query}%`),
                ilike(productCards.slug, `%${input.query}%`),
            )!,
        );
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [rows, countRows] = await Promise.all([
        db
            .select({
                id: productCards.id,
                slug: productCards.slug,
                title: productCards.title,
                type: productCards.type,
                isActive: productCards.isActive,
                updatedAt: productCards.updatedAt,
            })
            .from(productCards)
            .where(where)
            .orderBy(desc(productCards.updatedAt), desc(productCards.createdAt))
            .offset(input.offset)
            .limit(input.limit),
        db
            .select({ total: sql<number>`count(*)` })
            .from(productCards)
            .where(where),
    ]);

    const stagedRows = input.draftId
        ? await db
              .select({ id: productCardsStaging.id, op: productCardsStaging.op })
              .from(productCardsStaging)
              .where(eq(productCardsStaging.draftId, input.draftId))
        : [];
    const stagedById = new Map(stagedRows.map((row) => [row.id, row.op]));
    const stagedIds = new Set(stagedRows.map((row) => row.id));

    const cardIds = rows.map((row) => row.id);
    const liveIds = new Set(cardIds);
    const stagedCreateRows =
        input.draftId
            ? await db
                  .select({
                      id: productCardsStaging.id,
                      slug: productCardsStaging.slug,
                      title: productCardsStaging.title,
                      type: productCardsStaging.type,
                      isActive: productCardsStaging.isActive,
                      updatedAt: productCardsStaging.updatedAt,
                  })
                  .from(productCardsStaging)
                  .where(
                      and(
                          eq(productCardsStaging.draftId, input.draftId),
                          eq(productCardsStaging.op, "create"),
                      ),
                  )
            : [];

    return {
        items: [
            ...rows
                .filter((row) => stagedById.get(row.id) !== "delete")
                .map((row) => ({
                    ...row,
                    hasDraft: stagedIds.has(row.id),
                })),
            ...stagedCreateRows
                .filter((row) => !liveIds.has(row.id))
                .map((row) => ({ ...row, hasDraft: true })),
        ],
        pagination: {
            offset: input.offset,
            limit: input.limit,
            total: Number(countRows[0]?.total ?? 0),
        },
    };
});
