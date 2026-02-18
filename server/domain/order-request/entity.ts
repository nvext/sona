import { OrderRequestStatus } from "./types";

export interface OrderRequest {
    id: string;
    userId: string;

    idempotencyKey: string;

    status: OrderRequestStatus;

    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    contactTelegram: string | null;

    createdAt: Date;
    submittedAt: Date | null;
    sentAt: Date | null;
    deliveryAttempts: number;
    nextDeliveryRetryAt: Date | null;
    lastDeliveryError: string | null;
    updatedAt: Date;
}
