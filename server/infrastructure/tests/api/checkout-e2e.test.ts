import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import registerHandler from "~~/server/infrastructure/api/auth/register.post";
import loginHandler from "~~/server/infrastructure/api/auth/login.post";
import addItemHandler from "~~/server/infrastructure/api/cart/items.post";
import createDraftHandler from "~~/server/infrastructure/api/checkout/drafts.post";
import submitHandler from "~~/server/infrastructure/api/checkout/submit.post";
import catalogHandler from "~~/server/infrastructure/api/products/catalog.get";
import productDetailsHandler from "~~/server/infrastructure/api/products/[cardId].get";
import { callApi } from "./helpers";
import {
    DbCaptureCartSnapshotQuery,
    DbGetCartItemsQuery,
    DbGetCatalogPageQuery,
    PgCartItemRepo,
    PgCartRepo,
    PgFileRepo,
    PgOrderRequestRepo,
    PgProductCardRepo,
    PgProductColorRepo,
    PgProductRepo,
    PgProductSnapshotRepo,
    PgSessionRepo,
    PgUserRepo,
} from "~~/server/infrastructure/db";
import {
    Argon2PasswordHasher,
    Argon2TokenHasher,
    CryptoRefreshTokenGenerator,
    HmacAccessTokenIssuer,
    HmacAccessTokenVerifier,
    Sha256Fingerprinter,
    UuidGenerator,
    readAuthConfigFromEnv,
} from "~~/server/infrastructure/services";
import type { OrderRequestDeliveryService } from "~~/server/application/checkout/services/order-request-delivery";
import { createUseCases, type RuntimeContainer } from "~~/server/infrastructure/runtime";
import { processFailedOrderRequestsOnce } from "~~/server/infrastructure/runtime/order-request-delivery-retry";
import {
    FIXED_NOW,
    seedCatalog,
    setupDbTestHooks,
} from "~~/server/infrastructure/db/repos/tests/helpers";
import { resetRuntimeEnvCacheForTests } from "~~/server/infrastructure/runtime/env";
import { resetSecurityStateForTests } from "~~/server/infrastructure/http/api/security";
import type { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";

setupDbTestHooks();

class ScriptedDeliveryService implements OrderRequestDeliveryService {
    sentOrderRequestIds: string[] = [];

    constructor(private readonly outcomes: boolean[]) {}

    async send(input: { orderRequest: { id: string }; snapshots: ProductSnapshot[] }): Promise<void> {
        this.sentOrderRequestIds.push(input.orderRequest.id);
        const outcome = this.outcomes.length > 0 ? this.outcomes.shift()! : true;
        if (!outcome) {
            throw new Error("scripted delivery failure");
        }
    }
}

function createRuntimeForE2e(deliveryService: OrderRequestDeliveryService): {
    container: RuntimeContainer;
    useCases: ReturnType<typeof createUseCases>;
} {
    const userRepo = new PgUserRepo();
    const sessionRepo = new PgSessionRepo();
    const cartRepo = new PgCartRepo();
    const cartItemRepo = new PgCartItemRepo();
    const productRepo = new PgProductRepo();
    const productCardRepo = new PgProductCardRepo();
    const productColorRepo = new PgProductColorRepo();
    const fileRepo = new PgFileRepo();
    const orderRequestRepo = new PgOrderRequestRepo();
    const productSnapshotRepo = new PgProductSnapshotRepo();

    const getCatalogPageQuery = new DbGetCatalogPageQuery();
    const getCartItemsQuery = new DbGetCartItemsQuery();
    const captureCartSnapshotQuery = new DbCaptureCartSnapshotQuery();

    const passwordHasher = new Argon2PasswordHasher();
    const tokenHasher = new Argon2TokenHasher();
    const fingerprinter = new Sha256Fingerprinter();
    const idGenerator = new UuidGenerator();
    const refreshTokenGenerator = new CryptoRefreshTokenGenerator();
    const { authConfig, accessTokenConfig } = readAuthConfigFromEnv();
    const accessTokenIssuer = new HmacAccessTokenIssuer(accessTokenConfig);
    const accessTokenVerifier = new HmacAccessTokenVerifier(accessTokenConfig);

    const container: RuntimeContainer = {
        repos: {
            userRepo,
            sessionRepo,
            cartRepo,
            cartItemRepo,
            productRepo,
            productCardRepo,
            productColorRepo,
            fileRepo,
            orderRequestRepo,
            productSnapshotRepo,
        },
        queries: {
            getCatalogPageQuery,
            getCartItemsQuery,
            captureCartSnapshotQuery,
        },
        services: {
            passwordHasher,
            tokenHasher,
            fingerprinter,
            entityIdGenerator: idGenerator,
            uniqueIdGenerator: idGenerator,
            accessTokenIssuer,
            accessTokenVerifier,
            refreshTokenGenerator,
            orderRequestDeliveryService: deliveryService,
        },
        config: {
            authConfig,
        },
    };

    return {
        container,
        useCases: createUseCases(container),
    };
}

async function registerAndLogin(
    useCases: ReturnType<typeof createUseCases>,
    email: string,
    password: string,
): Promise<{ userId: string; cookieHeader: string }> {
    const registerResponse = await callApi({
        route: "/auth/register",
        method: "POST",
        handler: registerHandler as any,
        useCases,
        body: { email, password },
    });
    assert.equal(registerResponse.status, 200);

    const loginResponse = await callApi({
        route: "/auth/login",
        method: "POST",
        handler: loginHandler as any,
        useCases,
        body: { email, password },
    });
    assert.equal(loginResponse.status, 200);
    const setCookie = loginResponse.headers["set-cookie"];
    const cookieHeader = Array.isArray(setCookie)
        ? setCookie.map((value) => value.split(";")[0]).join("; ")
        : typeof setCookie === "string"
          ? setCookie.split(";")[0]
          : "";
    assert.notEqual(cookieHeader, "");

    return {
        userId: registerResponse.body.user.id as string,
        cookieHeader,
    };
}

async function createCartForUser(container: RuntimeContainer, userId: string, cartId: string): Promise<void> {
    await container.repos.cartRepo.add({
        entity: {
            id: cartId,
            userId,
            status: "active",
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
        },
    });
}

describe("infra checkout e2e", () => {
    beforeEach(() => {
        process.env.ORDER_DELIVERY_PROVIDER = "noop";
        process.env.RATE_LIMIT_WINDOW_MS = "60000";
        process.env.RATE_LIMIT_AUTH_MAX = "1000";
        process.env.RATE_LIMIT_SUBMIT_MAX = "1000";
        process.env.CORS_ALLOWED_ORIGINS = "";
        resetRuntimeEnvCacheForTests();
        resetSecurityStateForTests();
    });

    test("happy path: register -> login -> add -> draft -> submit(sent)", async () => {
        await seedCatalog();
        const delivery = new ScriptedDeliveryService([true]);
        const { container, useCases } = createRuntimeForE2e(delivery);

        const user = await registerAndLogin(useCases, "user1@example.com", "secret123");
        await createCartForUser(container, user.userId, "cart-1");

        const catalogResponse = await callApi({
            route: "/products/catalog",
            method: "GET",
            handler: catalogHandler as any,
            useCases,
        });
        assert.equal(catalogResponse.status, 200);
        assert.ok(Array.isArray(catalogResponse.body.data));
        assert.equal(catalogResponse.body.data.length, 1);
        assert.equal(catalogResponse.body.data[0].colors[0].images[0].id, "img-1");
        assert.equal(
            catalogResponse.body.data[0].colors[0].images[0].url,
            "https://cdn.example.com/products/panel-1-black-1.jpg",
        );

        const detailsResponse = await callApi({
            route: "/products/:cardId",
            requestPath: "/products/card-1",
            method: "GET",
            handler: productDetailsHandler as any,
            useCases,
        });
        assert.equal(detailsResponse.status, 200);
        assert.equal(detailsResponse.body.card.id, "card-1");
        assert.equal("imageIds" in detailsResponse.body.colors[0], false);
        assert.equal(detailsResponse.body.colors[0].images[0].id, "img-1");
        assert.equal(
            detailsResponse.body.colors[0].images[0].url,
            "https://cdn.example.com/products/panel-1-black-1.jpg",
        );

        const addResponse = await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            useCases,
            headers: { cookie: user.cookieHeader },
            body: { productId: "product-1", productColorId: "color-1" },
        });
        assert.equal(addResponse.status, 200);

        const draftResponse = await callApi({
            route: "/checkout/drafts",
            method: "POST",
            handler: createDraftHandler as any,
            useCases,
            headers: { cookie: user.cookieHeader },
            body: { cartId: "cart-1", idempotencyKey: "idem-1" },
        });
        assert.equal(draftResponse.status, 200);

        const submitResponse = await callApi({
            route: "/checkout/submit",
            method: "POST",
            handler: submitHandler as any,
            useCases,
            headers: { cookie: user.cookieHeader },
            body: {
                orderRequestId: draftResponse.body.orderRequest.id,
                contactName: "John",
                contactPhone: "+100",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
            },
        });
        assert.equal(submitResponse.status, 200);
        assert.equal(submitResponse.body.orderRequest.status, "sent");
        assert.equal(delivery.sentOrderRequestIds.length, 1);

        const { data: savedOrderRequest } = await container.repos.orderRequestRepo.getById({
            id: draftResponse.body.orderRequest.id,
        });
        assert.ok(savedOrderRequest);
        assert.equal(savedOrderRequest.status, "sent");
        assert.ok(savedOrderRequest.sentAt instanceof Date);
    });

    test("failure path: submit marks failed, worker retries and marks sent", async () => {
        await seedCatalog();
        const delivery = new ScriptedDeliveryService([false, true]);
        const { container, useCases } = createRuntimeForE2e(delivery);

        const user = await registerAndLogin(useCases, "user2@example.com", "secret123");
        await createCartForUser(container, user.userId, "cart-2");

        await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            useCases,
            headers: { cookie: user.cookieHeader },
            body: { productId: "product-1", productColorId: "color-1" },
        });

        const draftResponse = await callApi({
            route: "/checkout/drafts",
            method: "POST",
            handler: createDraftHandler as any,
            useCases,
            headers: { cookie: user.cookieHeader },
            body: { cartId: "cart-2", idempotencyKey: "idem-2" },
        });
        assert.equal(draftResponse.status, 200);

        const submitResponse = await callApi({
            route: "/checkout/submit",
            method: "POST",
            handler: submitHandler as any,
            useCases,
            headers: { cookie: user.cookieHeader },
            body: {
                orderRequestId: draftResponse.body.orderRequest.id,
                contactName: "John",
                contactPhone: "+100",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
            },
        });
        assert.equal(submitResponse.status, 500);
        assert.equal(submitResponse.body.statusMessage, "Failed to deliver order request");

        const { data: failedOrderRequest } = await container.repos.orderRequestRepo.getById({
            id: draftResponse.body.orderRequest.id,
        });
        assert.ok(failedOrderRequest);
        assert.equal(failedOrderRequest.status, "failed");
        assert.equal(failedOrderRequest.deliveryAttempts, 1);
        assert.ok(failedOrderRequest.nextDeliveryRetryAt instanceof Date);

        await container.repos.orderRequestRepo.update({
            patch: {
                id: failedOrderRequest.id,
                nextDeliveryRetryAt: new Date(Date.now() - 1),
                updatedAt: new Date(),
            },
        });

        await processFailedOrderRequestsOnce(container, {
            intervalMs: 1_000,
            batchSize: 20,
            maxAttempts: 5,
            baseDelayMs: 1_000,
            maxDelayMs: 60_000,
        });

        const { data: sentOrderRequest } = await container.repos.orderRequestRepo.getById({
            id: draftResponse.body.orderRequest.id,
        });
        assert.ok(sentOrderRequest);
        assert.equal(sentOrderRequest.status, "sent");
        assert.ok(sentOrderRequest.sentAt instanceof Date);
    });

    test("retry stops after max attempts", async () => {
        const delivery = new ScriptedDeliveryService([false, false]);
        const { container } = createRuntimeForE2e(delivery);

        await container.repos.userRepo.add({
            entity: {
                id: "user-max",
                name: "Макс",
                email: "user-max@example.com",
                phone: null,
                passwordHash: "hash",
                createdAt: FIXED_NOW,
                updatedAt: null,
                sessionVersion: 0,
                status: "active",
            },
        });

        await container.repos.orderRequestRepo.add({
            entity: {
                id: "order-max",
                userId: "user-max",
                idempotencyKey: "idem-max",
                status: "failed",
                contactName: "John",
                contactPhone: "+100",
                contactEmail: "john@example.com",
                contactTelegram: "@john",
                createdAt: FIXED_NOW,
                submittedAt: FIXED_NOW,
                sentAt: null,
                deliveryAttempts: 2,
                nextDeliveryRetryAt: new Date(FIXED_NOW.getTime() - 60_000),
                lastDeliveryError: "previous error",
                updatedAt: FIXED_NOW,
            },
        });

        await processFailedOrderRequestsOnce(container, {
            intervalMs: 1_000,
            batchSize: 20,
            maxAttempts: 3,
            baseDelayMs: 1_000,
            maxDelayMs: 60_000,
        });

        const { data: afterFirstRetry } = await container.repos.orderRequestRepo.getById({
            id: "order-max",
        });
        assert.ok(afterFirstRetry);
        assert.equal(afterFirstRetry.status, "failed");
        assert.equal(afterFirstRetry.deliveryAttempts, 3);
        assert.equal(afterFirstRetry.nextDeliveryRetryAt, null);

        await processFailedOrderRequestsOnce(container, {
            intervalMs: 1_000,
            batchSize: 20,
            maxAttempts: 3,
            baseDelayMs: 1_000,
            maxDelayMs: 60_000,
        });
        assert.equal(delivery.sentOrderRequestIds.length, 1);
    });

    test("access control: user cannot submit another user's request", async () => {
        await seedCatalog();
        const delivery = new ScriptedDeliveryService([true]);
        const { container, useCases } = createRuntimeForE2e(delivery);

        const user1 = await registerAndLogin(useCases, "owner@example.com", "secret123");
        const user2 = await registerAndLogin(useCases, "attacker@example.com", "secret123");
        await createCartForUser(container, user1.userId, "cart-owner");

        await callApi({
            route: "/cart/items",
            method: "POST",
            handler: addItemHandler as any,
            useCases,
            headers: { cookie: user1.cookieHeader },
            body: { productId: "product-1", productColorId: "color-1" },
        });

        const draftResponse = await callApi({
            route: "/checkout/drafts",
            method: "POST",
            handler: createDraftHandler as any,
            useCases,
            headers: { cookie: user1.cookieHeader },
            body: { cartId: "cart-owner", idempotencyKey: "idem-owner" },
        });
        assert.equal(draftResponse.status, 200);

        const forbiddenSubmit = await callApi({
            route: "/checkout/submit",
            method: "POST",
            handler: submitHandler as any,
            useCases,
            headers: { cookie: user2.cookieHeader },
            body: {
                orderRequestId: draftResponse.body.orderRequest.id,
                contactName: "Evil",
                contactPhone: "+999",
                contactEmail: "evil@example.com",
                contactTelegram: "@evil",
            },
        });

        assert.equal(forbiddenSubmit.status, 404);
        assert.equal(forbiddenSubmit.body.statusMessage, "Order request not found");
    });
});
