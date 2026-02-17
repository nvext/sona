import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SubmitOrderRequest } from "~~/server/application/checkout/uc/submit-order-request";
import type { OrderRequestRepo } from "~~/server/domain/order-request/repo";
import type { OrderRequest } from "~~/server/domain/order-request/entity";
import { NotFoundError } from "~~/server/shared/errors";

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
    updatedAt: new Date(),
};

function makeSut(updatedOrderRequest: OrderRequest | null) {
    let patchInput: Partial<OrderRequest> & { id: string } | null = null;

    const orderRequestRepo = {
        async update(input: { patch: Partial<OrderRequest> & { id: string } }) {
            patchInput = input.patch;
            return {
                data: updatedOrderRequest,
                meta: undefined,
            };
        },
    } as unknown as OrderRequestRepo;

    const uc = new SubmitOrderRequest(orderRequestRepo);

    return { uc, getPatchInput: () => patchInput };
}

describe("SubmitOrderRequest", () => {
    test("returns updated order request", async () => {
        const { uc, getPatchInput } = makeSut(baseOrderRequest);

        const result = await uc.execute({
            orderRequestId: "order-request-1",
            contactName: "John",
            contactPhone: "+10000000000",
            contactEmail: "john@example.com",
            contactTelegram: "@john",
        });

        assert.equal(result.orderRequest.id, "order-request-1");
        assert.equal(result.orderRequest.status, "submitted");

        const patch = getPatchInput();
        assert.ok(patch);
        assert.equal(patch.id, "order-request-1");
        assert.equal(patch.status, "submitted");
        assert.equal(patch.contactPhone, "+10000000000");
    });

    test("throws NotFoundError when order request does not exist", async () => {
        const { uc } = makeSut(null);

        await assert.rejects(
            uc.execute({
                orderRequestId: "missing-order-request",
                contactName: "John",
                contactPhone: "+10000000000",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
            }),
            (error) => error instanceof NotFoundError && error.message === "Order request not found",
        );
    });
});
