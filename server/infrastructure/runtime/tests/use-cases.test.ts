import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createUseCases, getRuntimeContainer } from "~~/server/infrastructure/runtime";
import { Login } from "~~/server/application/auth/uc/login";
import { Register } from "~~/server/application/auth/uc/register";
import { Refresh } from "~~/server/application/auth/uc/refresh";
import { Logout } from "~~/server/application/auth/uc/logout";
import { AddItemToCart } from "~~/server/application/cart/uc/add-product-to-cart";
import { RemoveItemFromCart } from "~~/server/application/cart/uc/remove-product-from-cart";
import { CreateOrderRequestDraft } from "~~/server/application/checkout/uc/create-order-request-draft";
import { SubmitOrderRequest } from "~~/server/application/checkout/uc/submit-order-request";
import { GetCatalogPage } from "~~/server/application/product/uc/get-catalog-page";
import { GetProductCardDetails } from "~~/server/application/product/uc/get-product-card-details";

describe("runtime wiring", () => {
    test("getRuntimeContainer returns singleton", () => {
        const first = getRuntimeContainer();
        const second = getRuntimeContainer();

        assert.equal(first, second);
    });

    test("createUseCases builds all use case instances", () => {
        const useCases = createUseCases(getRuntimeContainer());

        assert.ok(useCases.login instanceof Login);
        assert.ok(useCases.register instanceof Register);
        assert.ok(useCases.refresh instanceof Refresh);
        assert.ok(useCases.logout instanceof Logout);
        assert.ok(useCases.addItemToCart instanceof AddItemToCart);
        assert.ok(useCases.removeItemFromCart instanceof RemoveItemFromCart);
        assert.ok(useCases.createOrderRequestDraft instanceof CreateOrderRequestDraft);
        assert.ok(useCases.submitOrderRequest instanceof SubmitOrderRequest);
        assert.ok(useCases.getCatalogPage instanceof GetCatalogPage);
        assert.ok(useCases.getProductCardDetails instanceof GetProductCardDetails);
    });
});
