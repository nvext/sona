import { Login } from "~~/server/application/auth/uc/login";
import { Logout } from "~~/server/application/auth/uc/logout";
import { Refresh } from "~~/server/application/auth/uc/refresh";
import { Register } from "~~/server/application/auth/uc/register";
import { AddItemToCart } from "~~/server/application/cart/uc/add-product-to-cart";
import { RemoveItemFromCart } from "~~/server/application/cart/uc/remove-product-from-cart";
import { CreateOrderRequestDraft } from "~~/server/application/checkout/uc/create-order-request-draft";
import { SubmitOrderRequest } from "~~/server/application/checkout/uc/submit-order-request";
import { GetCatalogPage } from "~~/server/application/product/uc/get-catalog-page";
import { GetProductCardDetails } from "~~/server/application/product/uc/get-product-card-details";
import { RuntimeContainer, getRuntimeContainer } from "./container";
import { readDeliveryRetryConfigFromEnv } from "./order-request-delivery-retry";

export type RuntimeUseCases = {
    login: Login;
    logout: Logout;
    refresh: Refresh;
    register: Register;
    addItemToCart: AddItemToCart;
    removeItemFromCart: RemoveItemFromCart;
    createOrderRequestDraft: CreateOrderRequestDraft;
    submitOrderRequest: SubmitOrderRequest;
    getCatalogPage: GetCatalogPage;
    getProductCardDetails: GetProductCardDetails;
};

export function createUseCases(container: RuntimeContainer = getRuntimeContainer()): RuntimeUseCases {
    const deliveryRetryConfig = readDeliveryRetryConfigFromEnv();

    return {
        login: new Login(
            container.repos.userRepo,
            container.repos.sessionRepo,
            container.services.passwordHasher,
            container.services.entityIdGenerator,
            container.services.uniqueIdGenerator,
            container.services.accessTokenIssuer,
            container.services.refreshTokenGenerator,
            container.services.tokenHasher,
            container.services.fingerprinter,
            container.config.authConfig,
        ),
        logout: new Logout(container.repos.sessionRepo),
        refresh: new Refresh(
            container.repos.sessionRepo,
            container.services.refreshTokenGenerator,
            container.services.accessTokenIssuer,
            container.services.tokenHasher,
            container.services.fingerprinter,
            container.config.authConfig,
        ),
        register: new Register(
            container.repos.userRepo,
            container.services.entityIdGenerator,
            container.services.passwordHasher,
        ),
        addItemToCart: new AddItemToCart(
            container.repos.cartRepo,
            container.repos.cartItemRepo,
            container.repos.productRepo,
            container.repos.productCardRepo,
            container.repos.productColorRepo,
            container.services.entityIdGenerator,
        ),
        removeItemFromCart: new RemoveItemFromCart(
            container.repos.cartItemRepo,
            container.repos.cartRepo,
        ),
        createOrderRequestDraft: new CreateOrderRequestDraft(
            container.repos.cartRepo,
            container.repos.orderRequestRepo,
            container.queries.captureCartSnapshotQuery,
            container.services.entityIdGenerator,
        ),
        submitOrderRequest: new SubmitOrderRequest(
            container.repos.orderRequestRepo,
            container.repos.productSnapshotRepo,
            container.services.orderRequestDeliveryService,
            {
                maxAttempts: deliveryRetryConfig.maxAttempts,
                baseDelayMs: deliveryRetryConfig.baseDelayMs,
                maxDelayMs: deliveryRetryConfig.maxDelayMs,
            },
        ),
        getCatalogPage: new GetCatalogPage(container.queries.getCatalogPageQuery),
        getProductCardDetails: new GetProductCardDetails(
            container.repos.productCardRepo,
            container.repos.productColorRepo,
            container.repos.productRepo,
        ),
    };
}
