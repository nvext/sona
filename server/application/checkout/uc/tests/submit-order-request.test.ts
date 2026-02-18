import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SubmitOrderRequest } from "~~/server/application/checkout/uc/submit-order-request";
import type { OrderRequestRepo } from "~~/server/domain/order-request/repo";
import type { OrderRequest } from "~~/server/domain/order-request/entity";
import type { OrderRequestDeliveryService } from "~~/server/application/checkout/services/order-request-delivery";
import { NotFoundError, OperationFailedError } from "~~/server/shared/errors";
import { DeliveryRetryPolicy } from "~~/server/application/checkout/services/delivery-retry-policy";

const baseOrderRequest: OrderRequest = {
    id: "order-request-1",
    userId: "user-1",
    idempotencyKey: "idem-1",
    status: "submitted",
    contactName: "John",
    contactPhone: "+10000000000",
    contactEmail: "john@example.com",
    contactTelegram: "@john",
    createdAt: new Date(),
    submittedAt: new Date(),
    sentAt: null,
    deliveryAttempts: 0,
    nextDeliveryRetryAt: null,
    lastDeliveryError: null,
    updatedAt: new Date(),
};
const retryPolicy: DeliveryRetryPolicy = {
    maxAttempts: 3,
    baseDelayMs: 1_000,
    maxDelayMs: 60_000,
};

function makeSut(options: {
    existingOrderRequest: OrderRequest | null;
    firstUpdateOrderRequest: OrderRequest | null;
    secondUpdateOrderRequest: OrderRequest | null;
    deliveryError?: Error;
}) {
    const patchInputs: Array<Partial<OrderRequest> & { id: string }> = [];
    const deliveredOrderRequests: OrderRequest[] = [];

    const orderRequestRepo = {
        async getById() {
            return {
                data: options.existingOrderRequest,
                meta: undefined,
            };
        },
        async update(input: { patch: Partial<OrderRequest> & { id: string } }) {
            patchInputs.push(input.patch);
            return {
                data:
                    patchInputs.length === 1
                        ? options.firstUpdateOrderRequest
                        : options.secondUpdateOrderRequest,
                meta: undefined,
            };
        },
    } as unknown as OrderRequestRepo;
    const orderRequestDeliveryService = {
        async send(input: { orderRequest: OrderRequest }) {
            if (options.deliveryError) {
                throw options.deliveryError;
            }
            deliveredOrderRequests.push(input.orderRequest);
        },
    } as unknown as OrderRequestDeliveryService;

    const uc = new SubmitOrderRequest(orderRequestRepo, orderRequestDeliveryService, retryPolicy);

    return { uc, getPatchInputs: () => patchInputs, getDelivered: () => deliveredOrderRequests };
}

describe("SubmitOrderRequest", () => {
    test("returns updated order request", async () => {
        const sentOrderRequest: OrderRequest = {
            ...baseOrderRequest,
            status: "sent",
            sentAt: new Date(),
        };
        const { uc, getPatchInputs, getDelivered } = makeSut({
            existingOrderRequest: baseOrderRequest,
            firstUpdateOrderRequest: baseOrderRequest,
            secondUpdateOrderRequest: sentOrderRequest,
        });

        const result = await uc.execute({
            orderRequestId: "order-request-1",
            userId: "user-1",
            contactName: "John",
            contactPhone: "+10000000000",
            contactEmail: "john@example.com",
            contactTelegram: "@john",
        });

        assert.equal(result.orderRequest.id, "order-request-1");
        assert.equal(result.orderRequest.status, "sent");

        const patches = getPatchInputs();
        assert.equal(patches.length, 2);
        assert.equal(patches[0].id, "order-request-1");
        assert.equal(patches[0].status, "submitted");
        assert.equal(patches[0].contactPhone, "+10000000000");
        assert.equal(patches[0].deliveryAttempts, 0);
        assert.equal(patches[1].status, "sent");
        assert.ok(patches[1].sentAt instanceof Date);
        assert.equal(getDelivered().length, 1);
        assert.equal(getDelivered()[0].id, "order-request-1");
    });

    test("throws NotFoundError when order request does not exist", async () => {
        const { uc } = makeSut({
            existingOrderRequest: null,
            firstUpdateOrderRequest: null,
            secondUpdateOrderRequest: null,
        });

        await assert.rejects(
            uc.execute({
                orderRequestId: "missing-order-request",
                userId: "user-1",
                contactName: "John",
                contactPhone: "+10000000000",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
            }),
            (error) => error instanceof NotFoundError && error.message === "Order request not found",
        );
    });

    test("throws NotFoundError when order request belongs to another user", async () => {
        const { uc } = makeSut({
            existingOrderRequest: {
                ...baseOrderRequest,
                userId: "another-user",
            },
            firstUpdateOrderRequest: null,
            secondUpdateOrderRequest: null,
        });

        await assert.rejects(
            uc.execute({
                orderRequestId: "order-request-1",
                userId: "user-1",
                contactName: "John",
                contactPhone: "+10000000000",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
            }),
            (error) => error instanceof NotFoundError && error.message === "Order request not found",
        );
    });

    test("throws OperationFailedError when delivery fails", async () => {
        const { uc, getPatchInputs } = makeSut({
            existingOrderRequest: baseOrderRequest,
            firstUpdateOrderRequest: baseOrderRequest,
            secondUpdateOrderRequest: baseOrderRequest,
            deliveryError: new Error("telegram unavailable"),
        });

        await assert.rejects(
            uc.execute({
                orderRequestId: "order-request-1",
                userId: "user-1",
                contactName: "John",
                contactPhone: "+10000000000",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
            }),
            (error) =>
                error instanceof OperationFailedError &&
                error.message === "Failed to deliver order request",
        );

        const patches = getPatchInputs();
        assert.equal(patches.length, 2);
        assert.equal(patches[0].status, "submitted");
        assert.equal(patches[1].status, "failed");
        assert.equal(patches[1].deliveryAttempts, 1);
        assert.ok(patches[1].nextDeliveryRetryAt instanceof Date);
        assert.equal(patches[1].lastDeliveryError, "telegram unavailable");
    });
});
