import { CartRepo } from "~~/server/domain/cart/repo";
import { NotFoundError } from "~~/server/shared/errors";
import { CaptureCartSnapshotQuery } from "../queries/capture-cart-snapshot";
import { OrderRequestRepo } from "~~/server/domain/order-request/repo";
import { EntityIdGenerator } from "~~/server/shared/id";
import { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";
import { OrderRequest } from "~~/server/domain/order-request/entity";
import { OperationFailedError } from "~~/server/shared/errors/OperationFailedError";
import { ProductSnapshotRepo } from "~~/server/domain/product-snapshot/repo";

export class CreateOrderRequestDraft {
    constructor(
        private readonly cartRepo: CartRepo,
        private readonly orderRequestRepo: OrderRequestRepo,
        private readonly productSnapshotRepo: ProductSnapshotRepo,
        private readonly captureCartSnapshotQuery: CaptureCartSnapshotQuery,
        private readonly entityIdGenerator: EntityIdGenerator,
    ) {}

    async execute(input: CreateOrderRequestDraftInput): Promise<CreateOrderRequestDraftOutput> {
        const now = new Date();

        const { data: cart } = await this.cartRepo.getById({ id: input.cartId });

        if (cart === null) {
            throw new NotFoundError();
        }
        if (cart.userId !== input.userId) {
            throw new NotFoundError("Cart not found");
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

        try {
            const { data: snapshots } = await this.captureCartSnapshotQuery.execute({
                cartId: cart.id,
                orderRequestId: orderRequest.id,
            });
            await this.productSnapshotRepo.addMany({ entities: snapshots });

            return {
                orderRequest,
                snapshots,
            };
        } catch {
            throw new OperationFailedError("Failed to capture cart snapshot");
        }
    }
}

type CreateOrderRequestDraftInput = {
    cartId: string;
    userId: string;
    idempotencyKey: string;
};

export type CreateOrderRequestDraftOutput = {
    orderRequest: OrderRequest;
    snapshots: ProductSnapshot[];
};
