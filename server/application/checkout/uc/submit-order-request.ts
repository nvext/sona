import { OrderRequestRepo } from "~~/server/domain/order-request/repo";
import { OrderRequest } from "~~/server/domain/order-request/entity";
import { NotFoundError } from "~~/server/shared/errors";

export class SubmitOrderRequest {
    constructor(private readonly orderRequestRepo: OrderRequestRepo) {}

    async execute(input: SubmitOrderRequestInput): Promise<SubmitOrderRequestOutput> {
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
            },
        });

        if (orderRequest === null) {
            throw new NotFoundError("Order request not found");
        }

        return {
            orderRequest,
        };
    }
}

type SubmitOrderRequestInput = {
    orderRequestId: string;

    contactName: string | null;
    contactPhone: string;
    contactEmail: string | null;
    contactTelegram: string | null;
};

type SubmitOrderRequestOutput = {
    orderRequest: OrderRequest;
};
