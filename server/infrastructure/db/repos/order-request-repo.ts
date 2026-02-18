import { and, asc, desc, eq } from "drizzle-orm";
import { RepoResponse } from "~~/server/domain/base/types";
import { OrderRequest } from "~~/server/domain/order-request/entity";
import { OrderRequestRepo } from "~~/server/domain/order-request/repo";
import { db } from "../connection";
import { orderRequests } from "../schema";
import { PgBaseRepo } from "./base";

export class PgOrderRequestRepo
    extends PgBaseRepo<OrderRequest>
    implements OrderRequestRepo
{
    constructor() {
        super(orderRequests);
    }

    async upsertDraft(parameters: {
        entity: Omit<
            OrderRequest,
            | "status"
            | "contactName"
            | "contactPhone"
            | "contactEmail"
            | "contactTelegram"
            | "sentAt"
            | "submittedAt"
        >;
    }): Promise<RepoResponse<OrderRequest>> {
        const [row] = await db
            .insert(orderRequests)
            .values({
                ...parameters.entity,
                status: "draft",
                contactName: null,
                contactPhone: null,
                contactEmail: null,
                contactTelegram: null,
                submittedAt: null,
                sentAt: null,
            })
            .onConflictDoUpdate({
                target: [orderRequests.userId, orderRequests.idempotencyKey],
                set: {
                    updatedAt: parameters.entity.updatedAt,
                },
            })
            .returning();

        return { data: row as OrderRequest, meta: undefined };
    }

    async getDraftByUserId(parameters: { userId: string }): Promise<RepoResponse<OrderRequest | null>> {
        const [row] = await db
            .select()
            .from(orderRequests)
            .where(and(eq(orderRequests.userId, parameters.userId), eq(orderRequests.status, "draft")))
            .orderBy(desc(orderRequests.updatedAt))
            .limit(1);

        return { data: (row as OrderRequest | undefined) ?? null, meta: undefined };
    }

    async getFailedForDelivery(parameters: { limit: number }): Promise<RepoResponse<OrderRequest[]>> {
        const rows = await db
            .select()
            .from(orderRequests)
            .where(eq(orderRequests.status, "failed"))
            .orderBy(asc(orderRequests.updatedAt))
            .limit(parameters.limit);

        return { data: rows as OrderRequest[], meta: undefined };
    }
}
