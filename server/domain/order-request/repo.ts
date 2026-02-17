import { BaseRepo } from "../base";
import { RepoResponse } from "../base/types";
import { OrderRequest } from "./entity";

export interface OrderRequestRepo extends BaseRepo<OrderRequest> {
    upsertDraft(parameters: {
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
    }): Promise<RepoResponse<OrderRequest>>;
    getDraftByUserId(parameters: { userId: string }): Promise<RepoResponse<OrderRequest | null>>;
}
