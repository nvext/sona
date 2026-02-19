import {
    DbCaptureCartSnapshotQuery,
    DbGetCatalogPageQuery,
    DbGetCartItemsQuery,
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
    HmacAccessTokenIssuer,
    HmacAccessTokenVerifier,
    CryptoRefreshTokenGenerator,
    readAuthConfigFromEnv,
    Sha256Fingerprinter,
    UuidGenerator,
    NoopOrderRequestDeliveryService,
    TelegramOrderRequestDeliveryService,
    readTelegramDeliveryConfigFromEnv,
} from "~~/server/infrastructure/services";
import { OrderRequestDeliveryService } from "~~/server/application/checkout/services/order-request-delivery";

export type RuntimeContainer = {
    repos: {
        userRepo: PgUserRepo;
        sessionRepo: PgSessionRepo;
        cartRepo: PgCartRepo;
        cartItemRepo: PgCartItemRepo;
        productRepo: PgProductRepo;
        productCardRepo: PgProductCardRepo;
        productColorRepo: PgProductColorRepo;
        fileRepo: PgFileRepo;
        orderRequestRepo: PgOrderRequestRepo;
        productSnapshotRepo: PgProductSnapshotRepo;
    };
    queries: {
        getCatalogPageQuery: DbGetCatalogPageQuery;
        getCartItemsQuery: DbGetCartItemsQuery;
        captureCartSnapshotQuery: DbCaptureCartSnapshotQuery;
    };
    services: {
        passwordHasher: Argon2PasswordHasher;
        tokenHasher: Argon2TokenHasher;
        fingerprinter: Sha256Fingerprinter;
        entityIdGenerator: UuidGenerator;
        uniqueIdGenerator: UuidGenerator;
        accessTokenIssuer: HmacAccessTokenIssuer;
        accessTokenVerifier: HmacAccessTokenVerifier;
        refreshTokenGenerator: CryptoRefreshTokenGenerator;
        orderRequestDeliveryService: OrderRequestDeliveryService;
    };
    config: {
        authConfig: ReturnType<typeof readAuthConfigFromEnv>["authConfig"];
    };
};

let container: RuntimeContainer | null = null;

export function getRuntimeContainer(): RuntimeContainer {
    if (container !== null) {
        return container;
    }

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
    const telegramConfig = readTelegramDeliveryConfigFromEnv();
    const orderRequestDeliveryService: OrderRequestDeliveryService = telegramConfig
        ? new TelegramOrderRequestDeliveryService(telegramConfig)
        : new NoopOrderRequestDeliveryService();

    container = {
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
            orderRequestDeliveryService,
        },
        config: {
            authConfig,
        },
    };

    return container;
}
