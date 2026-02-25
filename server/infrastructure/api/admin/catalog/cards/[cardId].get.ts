import { and, eq, inArray } from "drizzle-orm";
import { createError } from "h3";
import { z } from "zod";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { readValidatedParam, readValidatedQuery } from "~~/server/infrastructure/http/api/validation";
import { db } from "~~/server/infrastructure/db/connection";
import {
    files,
    productCards,
    productCardsStaging,
    productColors,
    productColorsStaging,
} from "~~/server/infrastructure/db/schema";

const cardIdSchema = z.string().trim().min(1);
const cardQuerySchema = z.object({
    draftId: z.string().trim().optional(),
});

export default defineApiHandler(async (event) => {
    await requireAdmin(event);
    const cardId = readValidatedParam(event, "cardId", cardIdSchema);
    const query = readValidatedQuery(event, cardQuerySchema);

    const [liveCard] = await db.select().from(productCards).where(eq(productCards.id, cardId)).limit(1);
    const [stagedCard] = query.draftId
        ? await db
              .select()
              .from(productCardsStaging)
              .where(and(eq(productCardsStaging.draftId, query.draftId), eq(productCardsStaging.id, cardId)))
              .limit(1)
        : [];

    if (!liveCard && !stagedCard) {
        throw createError({ statusCode: 404, statusMessage: "Card not found" });
    }

    const [liveColors, stagedColors] = await Promise.all([
        db.select().from(productColors).where(eq(productColors.productCardId, cardId)),
        query.draftId
            ? db
                  .select()
                  .from(productColorsStaging)
                  .where(
                      and(
                          eq(productColorsStaging.draftId, query.draftId),
                          eq(productColorsStaging.productCardId, cardId),
                      ),
                  )
            : Promise.resolve([]),
    ]);

    const fileIds = Array.from(
        new Set(
            [...liveColors, ...stagedColors].flatMap((color) => color.imageIds ?? []),
        ),
    );
    const fileRows =
        fileIds.length === 0 ? [] : await db.select().from(files).where(inArray(files.id, fileIds));
    const filesById = new Map(fileRows.map((row) => [row.id, row]));

    const liveColorsById = new Map<string, (typeof liveColors)[number]>(liveColors.map((row) => [row.id, row]));
    for (const stagedColor of stagedColors) {
        if (stagedColor.op === "delete") {
            liveColorsById.delete(stagedColor.id);
            continue;
        }

        const existing = liveColorsById.get(stagedColor.id);
        liveColorsById.set(stagedColor.id, {
            ...(existing ?? stagedColor),
            ...stagedColor,
        });
    }

    const baseCard = liveCard ?? stagedCard!;
    const card =
        stagedCard && stagedCard.op !== "none"
            ? {
                  ...baseCard,
                  ...stagedCard,
                  hasDraft: true,
              }
            : {
                  ...baseCard,
                  hasDraft: Boolean(stagedCard),
              };

    const colors = [...liveColorsById.values()].map((color) => ({
        ...color,
        hasDraft: stagedColors.some((staged) => staged.id === color.id),
        images: (color.imageIds ?? []).flatMap((id) => {
            const file = filesById.get(id);
            return file ? [{ id: file.id, url: file.url }] : [];
        }),
    }));

    return { card, colors };
});
