import { OrderRequestRepo } from "~~/server/domain/order-request/repo";
import { OrderRequest } from "~~/server/domain/order-request/entity";
import { NotFoundError, OperationFailedError } from "~~/server/shared/errors";
import { OrderRequestDeliveryService } from "../services/order-request-delivery";
import {
    calculateNextDeliveryRetryAt,
    DeliveryRetryPolicy,
} from "../services/delivery-retry-policy";

export class SubmitOrderRequest {
    constructor(
        private readonly orderRequestRepo: OrderRequestRepo,
        private readonly orderRequestDeliveryService: OrderRequestDeliveryService,
        private readonly retryPolicy: DeliveryRetryPolicy,
    ) {}

    async execute(input: SubmitOrderRequestInput): Promise<SubmitOrderRequestOutput> {
        const { data: currentOrderRequest } = await this.orderRequestRepo.getById({
            id: input.orderRequestId,
        });
        if (currentOrderRequest === null || currentOrderRequest.userId !== input.userId) {
            throw new NotFoundError("Order request not found");
        }

        const now = new Date();

        const { data: orderRequest } = await this.orderRequestRepo.update({
            patch: {
                id: input.orderRequestId,

                contactName: input.contactName,
                contactPhone: input.contactPhone,
                contactEmail: input.contactEmail,
                contactTelegram: input.contactTelegram,

                updatedAt: now,
                submittedAt: now,

                status: "submitted",
                deliveryAttempts: 0,
                nextDeliveryRetryAt: null,
                lastDeliveryError: null,
            },
        });

        if (orderRequest === null) {
            throw new NotFoundError("Order request not found");
        }

        try {
            await this.orderRequestDeliveryService.send({ orderRequest });
        } catch (error) {
            const attempts = orderRequest.deliveryAttempts + 1;
            const retryAt = calculateNextDeliveryRetryAt({
                attempts,
                policy: this.retryPolicy,
                now: new Date(),
            });
            await this.orderRequestRepo.update({
                patch: {
                    id: orderRequest.id,
                    status: "failed",
                    deliveryAttempts: attempts,
                    nextDeliveryRetryAt: retryAt,
                    lastDeliveryError: error instanceof Error ? error.message : "Delivery failed",
                    updatedAt: new Date(),
                },
            });
            throw new OperationFailedError("Failed to deliver order request");
        }

        const { data: sentOrderRequest } = await this.orderRequestRepo.update({
            patch: {
                id: orderRequest.id,
                status: "sent",
                deliveryAttempts: orderRequest.deliveryAttempts,
                nextDeliveryRetryAt: null,
                lastDeliveryError: null,
                updatedAt: new Date(),
                sentAt: new Date(),
            },
        });
        if (sentOrderRequest === null) {
            throw new NotFoundError("Order request not found");
        }

        return {
            orderRequest: sentOrderRequest,
        };
    }
}

type SubmitOrderRequestInput = {
    orderRequestId: string;
    userId: string;

    contactName: string | null;
    contactPhone: string;
    contactEmail: string | null;
    contactTelegram: string | null;
};

type SubmitOrderRequestOutput = {
    orderRequest: OrderRequest;
};
