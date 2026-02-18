import { before, beforeEach } from "node:test";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, PgCartRepo, PgProductCardRepo, PgProductColorRepo, PgProductRepo, PgUserRepo } from "~~/server/infrastructure/db";

const TABLES = [
    "product_snapshots",
    "cart_items",
    "products",
    "product_colors",
    "product_cards",
    "order_requests",
    "sessions",
    "carts",
    "users",
];

let migrationPromise: Promise<void> | null = null;

export const FIXED_NOW = new Date("2026-01-01T00:00:00.000Z");

export function setupDbTestHooks() {
    before(async () => {
        if (!migrationPromise) {
            migrationPromise = migrate(db, { migrationsFolder: "drizzle" }).then(() => undefined);
        }
        await migrationPromise;
    });

    beforeEach(async () => {
        await db.execute(sql.raw(`TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`));
    });
}

export async function seedUser() {
    const userRepo = new PgUserRepo();
    await userRepo.add({
        entity: {
            id: "user-1",
            email: "user@example.com",
            phone: "+10000000000",
            passwordHash: "hash",
            createdAt: FIXED_NOW,
            updatedAt: null,
            sessionVersion: 0,
            status: "active",
        },
    });
}

export async function seedCatalog() {
    const productCardRepo = new PgProductCardRepo();
    const productColorRepo = new PgProductColorRepo();
    const productRepo = new PgProductRepo();

    await productCardRepo.add({
        entity: {
            id: "card-1",
            type: "panel",
            slug: "panel-1",
            title: "Panel",
            description: "desc",
            isActive: true,
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
        },
    });

    await productColorRepo.add({
        entity: {
            id: "color-1",
            productCardId: "card-1",
            name: "Black",
            hex: "#000",
            imageIds: ["img-1"],
            isActive: true,
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
        },
    });

    await productRepo.add({
        entity: {
            id: "product-1",
            cardId: "card-1",
            productColorId: "color-1",
            width: 100,
            height: 100,
            thickness: 10,
            price: 1000,
            currency: "RUB",
            isActive: true,
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
        },
    });
}

export async function seedCart() {
    const cartRepo = new PgCartRepo();
    await cartRepo.add({
        entity: {
            id: "cart-1",
            userId: "user-1",
            status: "active",
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
        },
    });
}
