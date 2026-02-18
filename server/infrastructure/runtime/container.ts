import {
    DbCaptureCartSnapshotQuery,
    DbGetCatalogPageQuery,
    PgCartItemRepo,
    PgCartRepo,
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
} from "~~/server/infrastructure/services";

export type RuntimeContainer = {
    repos: {
        userRepo: PgUserRepo;
        sessionRepo: PgSessionRepo;
        cartRepo: PgCartRepo;
        cartItemRepo: PgCartItemRepo;
        productRepo: PgProductRepo;
        productCardRepo: PgProductCardRepo;
        productColorRepo: PgProductColorRepo;
        orderRequestRepo: PgOrderRequestRepo;
        productSnapshotRepo: PgProductSnapshotRepo;
    };
    queries: {
        getCatalogPageQuery: DbGetCatalogPageQuery;
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
        orderRequestDeliveryService: NoopOrderRequestDeliveryService;
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
    const orderRequestRepo = new PgOrderRequestRepo();
    const productSnapshotRepo = new PgProductSnapshotRepo();

    const getCatalogPageQuery = new DbGetCatalogPageQuery();
    const captureCartSnapshotQuery = new DbCaptureCartSnapshotQuery();

    const passwordHasher = new Argon2PasswordHasher();
    const tokenHasher = new Argon2TokenHasher();
    const fingerprinter = new Sha256Fingerprinter();
    const idGenerator = new UuidGenerator();
    const refreshTokenGenerator = new CryptoRefreshTokenGenerator();
    const { authConfig, accessTokenConfig } = readAuthConfigFromEnv();
    const accessTokenIssuer = new HmacAccessTokenIssuer(accessTokenConfig);
    const accessTokenVerifier = new HmacAccessTokenVerifier(accessTokenConfig);
    const orderRequestDeliveryService = new NoopOrderRequestDeliveryService();

    container = {
        repos: {
            userRepo,
            sessionRepo,
            cartRepo,
            cartItemRepo,
            productRepo,
            productCardRepo,
            productColorRepo,
            orderRequestRepo,
            productSnapshotRepo,
        },
        queries: {
            getCatalogPageQuery,
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
