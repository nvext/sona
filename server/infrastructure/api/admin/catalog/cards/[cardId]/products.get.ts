import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { readValidatedParam, readValidatedQuery } from "~~/server/infrastructure/http/api/validation";
import { db } from "~~/server/infrastructure/db/connection";
import { products, productsStaging } from "~~/server/infrastructure/db/schema";

const cardIdSchema = z.string().trim().min(1);
const productsQuerySchema = z.object({
    draftId: z.string().trim().optional(),
});

export default defineApiHandler(async (event) => {
    await requireAdmin(event);
    const cardId = readValidatedParam(event, "cardId", cardIdSchema);
    const query = readValidatedQuery(event, productsQuerySchema);

    const [liveProducts, stagedProducts] = await Promise.all([
        db.select().from(products).where(eq(products.cardId, cardId)),
        query.draftId
            ? db
                  .select()
                  .from(productsStaging)
                  .where(
                      and(
                          eq(productsStaging.draftId, query.draftId),
                          eq(productsStaging.cardId, cardId),
                      ),
                  )
            : Promise.resolve([]),
    ]);

    const merged = new Map(liveProducts.map((item) => [item.id, { ...item, hasDraft: false }]));

    for (const staged of stagedProducts) {
        if (staged.op === "delete") {
            merged.delete(staged.id);
            continue;
        }

        const existing = merged.get(staged.id);
        merged.set(staged.id, {
            ...(existing ?? staged),
            ...staged,
            hasDraft: true,
        });
    }

    return {
        items: [...merged.values()],
    };
});
