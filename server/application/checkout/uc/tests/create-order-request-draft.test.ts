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
import type { ProductSnapshotRepo } from "~~/server/domain/product-snapshot/repo";

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
    deliveryAttempts: 0,
    nextDeliveryRetryAt: null,
    lastDeliveryError: null,
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
    quantity: 2,
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
    let savedSnapshots: ProductSnapshot[] | null = null;

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

    const productSnapshotRepo = {
        async addMany(input: { entities: ProductSnapshot[] }) {
            savedSnapshots = input.entities;
            return { data: input.entities, meta: undefined };
        },
    } as unknown as ProductSnapshotRepo;

    const uc = new CreateOrderRequestDraft(
        cartRepo,
        orderRequestRepo,
        productSnapshotRepo,
        captureCartSnapshotQuery,
        new StaticEntityIdGenerator(),
    );

    return {
        uc,
        getCapturedSnapshotInput: () => capturedSnapshotInput,
        getSavedSnapshots: () => savedSnapshots,
    };
}

describe("CreateOrderRequestDraft", () => {
    test("returns orderRequest and snapshots", async () => {
        const { uc, getCapturedSnapshotInput, getSavedSnapshots } = makeSut({ cart: baseCart });

        const result = await uc.execute({
            cartId: baseCart.id,
            userId: "user-1",
            idempotencyKey: "idem-1",
        });

        assert.equal(result.orderRequest.status, "draft");
        assert.equal(result.snapshots.length, 1);
        assert.deepEqual(getCapturedSnapshotInput(), {
            cartId: baseCart.id,
            orderRequestId: baseOrderRequest.id,
        });
        assert.equal(getSavedSnapshots()?.length, 1);
    });

    test("throws NotFoundError when cart is missing", async () => {
        const { uc } = makeSut({ cart: null });

        await assert.rejects(
            uc.execute({ cartId: "missing-cart", userId: "user-1", idempotencyKey: "idem-1" }),
            NotFoundError,
        );
    });

    test("throws NotFoundError when cart belongs to another user", async () => {
        const { uc } = makeSut({
            cart: {
                ...baseCart,
                userId: "another-user",
            },
        });

        await assert.rejects(
            uc.execute({ cartId: baseCart.id, userId: "user-1", idempotencyKey: "idem-1" }),
            (error) => error instanceof NotFoundError && error.message === "Cart not found",
        );
    });

    test("throws OperationFailedError when snapshot query fails", async () => {
        const { uc } = makeSut({
            cart: baseCart,
            snapshotError: new Error("db failure"),
        });

        await assert.rejects(
            uc.execute({ cartId: baseCart.id, userId: "user-1", idempotencyKey: "idem-1" }),
            (error) =>
                error instanceof OperationFailedError &&
                error.message === "Failed to capture cart snapshot",
        );
    });
});
