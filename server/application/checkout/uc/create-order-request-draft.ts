import { CartRepo } from "~~/server/domain/cart/repo";
import { NotFoundError } from "~~/server/shared/errors";
import { CaptureCartSnapshotQuery } from "../queries/capture-cart-snapshot";
import { OrderRequestRepo } from "~~/server/domain/order-request/repo";
import { EntityIdGenerator } from "~~/server/shared/id";

export class CreateOrderRequestDraft {
    constructor(
        private readonly cartRepo: CartRepo,
        private readonly orderRequestRepo: OrderRequestRepo,
        private readonly captureCartSnapshotQuery: CaptureCartSnapshotQuery,
        private readonly entityIdGenerator: EntityIdGenerator,
    ) {}

    async execute(input: CreateOrderRequestDraftInput) {
        const now = new Date();

        const { data: cart } = await this.cartRepo.getById({ id: input.cartId });

        if (cart === null) {
            throw new NotFoundError();
        }

        const { data: orderRequest } = await this.orderRequestRepo.upsertDraft({
            entity: {
                id: this.entityIdGenerator.generate(),
                userId: cart.userId,
                idempotencyKey: input.idempotencyKey,

                createdAt: now,
                updatedAt: now,
            },
        });

        const { data: snapshots } = await this.captureCartSnapshotQuery.execute({
            cartId: cart.id,
            orderRequestId: orderRequest.id,
        });
    }
}

type CreateOrderRequestDraftInput = {
    cartId: string;
    idempotencyKey: string;
};
