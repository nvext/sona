import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { CreateOrderRequestDraft } from "~~/server/application/checkout/uc/create-order-request-draft";
import type { CartRepo } from "~~/server/domain/cart/repo";
import type { OrderRequestRepo } from "~~/server/domain/order-request/repo";
import type { CaptureCartSnapshotQuery } from "~~/server/application/checkout/queries/capture-cart-snapshot";
import type { EntityIdGenerator } from "~~/server/shared/id";
import { NotFoundError } from "~~/server/shared/errors";
import { OperationFailedError } from "~~/server/shared/errors/OperationFailedError";
import type { Cart } from "~~/server/domain/cart/entity";
import type { OrderRequest } from "~~/server/domain/order-request/entity";
import type { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";

const baseCart: Cart = {
    id: "cart-1",
    userId: "user-1",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
};

const baseOrderRequest: OrderRequest = {
    id: "order-request-1",
    userId: "user-1",
    idempotencyKey: "idem-1",
    status: "draft",
    contactName: null,
    contactPhone: null,
    contactEmail: null,
    contactTelegram: null,
    createdAt: new Date(),
    submittedAt: null,
    sentAt: null,
    updatedAt: new Date(),
};

const baseSnapshot: ProductSnapshot = {
    id: "snapshot-1",
    orderRequestId: "order-request-1",
    productId: "product-1",
    title: "Panel 1",
    description: "desc",
    colorId: "color-1",
    colorName: "Black",
    colorHex: "#000000",
    imageIds: ["img-1"],
    width: 100,
    height: 100,
    thickness: 10,
    price: 1000,
    currency: "RUB",
    capturedAt: new Date(),
};

class StaticEntityIdGenerator implements EntityIdGenerator {
    generate(): string {
        return "generated-id-1";
    }
}

type BuildOptions = {
    cart: Cart | null;
    snapshots?: ProductSnapshot[];
    snapshotError?: Error;
};

function makeSut(options: BuildOptions) {
    let capturedSnapshotInput: { cartId: string; orderRequestId: string } | null = null;

    const cartRepo = {
        async getById() {
            return { data: options.cart, meta: undefined };
        },
    } as unknown as CartRepo;

    const orderRequestRepo = {
        async upsertDraft() {
            return {
                data: {
                    ...baseOrderRequest,
                    userId: options.cart?.userId ?? baseOrderRequest.userId,
                },
                meta: undefined,
            };
        },
    } as unknown as OrderRequestRepo;

    const captureCartSnapshotQuery = {
        async execute(input: { cartId: string; orderRequestId: string }) {
            capturedSnapshotInput = input;

            if (options.snapshotError) {
                throw options.snapshotError;
            }

            return {
                data: options.snapshots ?? [baseSnapshot],
                meta: undefined,
            };
        },
    } as unknown as CaptureCartSnapshotQuery;

    const uc = new CreateOrderRequestDraft(
        cartRepo,
        orderRequestRepo,
        captureCartSnapshotQuery,
        new StaticEntityIdGenerator(),
    );

    return { uc, getCapturedSnapshotInput: () => capturedSnapshotInput };
}

describe("CreateOrderRequestDraft", () => {
    test("returns orderRequest and snapshots", async () => {
        const { uc, getCapturedSnapshotInput } = makeSut({ cart: baseCart });

        const result = await uc.execute({ cartId: baseCart.id, idempotencyKey: "idem-1" });

        assert.equal(result.orderRequest.status, "draft");
        assert.equal(result.snapshots.length, 1);
        assert.deepEqual(getCapturedSnapshotInput(), {
            cartId: baseCart.id,
            orderRequestId: baseOrderRequest.id,
        });
    });

    test("throws NotFoundError when cart is missing", async () => {
        const { uc } = makeSut({ cart: null });

        await assert.rejects(
            uc.execute({ cartId: "missing-cart", idempotencyKey: "idem-1" }),
            NotFoundError,
        );
    });

    test("throws OperationFailedError when snapshot query fails", async () => {
        const { uc } = makeSut({
            cart: baseCart,
            snapshotError: new Error("db failure"),
        });

        await assert.rejects(
            uc.execute({ cartId: baseCart.id, idempotencyKey: "idem-1" }),
            (error) =>
                error instanceof OperationFailedError &&
                error.message === "Failed to capture cart snapshot",
        );
    });
});
