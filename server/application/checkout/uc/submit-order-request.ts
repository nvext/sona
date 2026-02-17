import { OrderRequestRepo } from "~~/server/domain/order-request/repo";

export class SubmitOrderRequest {
    constructor(private readonly orderRequestRepo: OrderRequestRepo) {}

    async execute(input: SubmitOrderRequestInput) {
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
    }
}

type SubmitOrderRequestInput = {
    orderRequestId: string;

    contactName: string | null;
    contactPhone: string;
    contactEmail: string | null;
    contactTelegram: string | null;
};
