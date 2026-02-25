import { and, desc, eq } from "drizzle-orm";
import { createError } from "h3";
import { randomUUID } from "node:crypto";
import { db } from "~~/server/infrastructure/db/connection";
import { catalogDrafts } from "~~/server/infrastructure/db/schema";

export async function resolveOrCreateOpenDraft(input: {
    draftId?: string;
    userId: string;
}): Promise<string> {
    if (input.draftId && input.draftId.length > 0) {
        const [draft] = await db
            .select()
            .from(catalogDrafts)
            .where(and(eq(catalogDrafts.id, input.draftId), eq(catalogDrafts.status, "open")))
            .limit(1);

        if (!draft) {
            throw createError({ statusCode: 404, statusMessage: "Draft not found" });
        }

        return draft.id;
    }

    const [latestOpenDraft] = await db
        .select()
        .from(catalogDrafts)
        .where(and(eq(catalogDrafts.createdBy, input.userId), eq(catalogDrafts.status, "open")))
        .orderBy(desc(catalogDrafts.updatedAt))
        .limit(1);

    if (latestOpenDraft) {
        return latestOpenDraft.id;
    }

    const now = new Date();
    const draftId = randomUUID();
    await db.insert(catalogDrafts).values({
        id: draftId,
        status: "open",
        createdBy: input.userId,
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
    });

    return draftId;
}

export async function touchDraftUpdatedAt(draftId: string): Promise<void> {
    await db
        .update(catalogDrafts)
        .set({ updatedAt: new Date() })
        .where(and(eq(catalogDrafts.id, draftId), eq(catalogDrafts.status, "open")));
}
