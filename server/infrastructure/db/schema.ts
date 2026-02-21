import { pgTable, text, integer, boolean, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { cartStatuses } from "~~/server/domain/cart/const";
import { fileStorageProviders } from "~~/server/domain/file/const";
import { orderRequestStatuses } from "~~/server/domain/order-request/const";
import { productTypes } from "~~/server/domain/product-card/const";
import { currencies } from "~~/server/shared/const";
import type { User } from "~~/server/domain/user/entity";

export const users = pgTable(
    "users",
    {
        id: text("id").primaryKey(),
        name: text("name"),
        email: text("email"),
        phone: text("phone"),
        passwordHash: text("password_hash").notNull(),
        createdAt: timestamp("created_at", { mode: "date" }).notNull(),
        updatedAt: timestamp("updated_at", { mode: "date" }),
        sessionVersion: integer("session_version").notNull(),
        status: text("status").$type<User["status"]>().notNull(),
    },
    (table) => ({
        emailUnique: uniqueIndex("users_email_unique").on(table.email),
        phoneUnique: uniqueIndex("users_phone_unique").on(table.phone),
    }),
);

export const sessions = pgTable(
    "sessions",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { mode: "date" }).notNull(),
        expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
        lastSeenAt: timestamp("last_seen_at", { mode: "date" }).notNull(),
        revokedAt: timestamp("revoked_at", { mode: "date" }),
        refreshTokenHash: text("refresh_token_hash").notNull(),
        refreshTokenFamilyId: text("refresh_token_family_id").notNull(),
        refreshTokenFingerprint: text("refresh_token_fingerprint").notNull(),
        version: integer("version").notNull(),
    },
    (table) => ({
        refreshTokenFingerprintUnique: uniqueIndex("sessions_refresh_token_fingerprint_unique").on(
            table.refreshTokenFingerprint,
        ),
    }),
);

export const carts = pgTable("carts", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<(typeof cartStatuses)[number]>().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const productCards = pgTable(
    "product_cards",
    {
        id: text("id").primaryKey(),
        type: text("type").$type<(typeof productTypes)[number]>().notNull(),
        slug: text("slug").notNull(),
        title: text("title").notNull(),
        description: text("description").notNull(),
        isActive: boolean("is_active").notNull(),
        createdAt: timestamp("created_at", { mode: "date" }).notNull(),
        updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
    },
    (table) => ({
        slugUnique: uniqueIndex("product_cards_slug_unique").on(table.slug),
    }),
);

export const productColors = pgTable("product_colors", {
    id: text("id").primaryKey(),
    productCardId: text("product_card_id")
        .notNull()
        .references(() => productCards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hex: text("hex").notNull(),
    imageIds: jsonb("image_ids").$type<string[]>().notNull(),
    isActive: boolean("is_active").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const files = pgTable("files", {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    storageProvider: text("storage_provider").$type<(typeof fileStorageProviders)[number]>(),
    storageBucket: text("storage_bucket"),
    storageKey: text("storage_key"),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const products = pgTable("products", {
    id: text("id").primaryKey(),
    cardId: text("card_id")
        .notNull()
        .references(() => productCards.id, { onDelete: "restrict" }),
    productColorId: text("product_color_id")
        .notNull()
        .references(() => productColors.id, { onDelete: "restrict" }),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    thickness: integer("thickness").notNull(),
    price: integer("price").notNull(),
    currency: text("currency").$type<(typeof currencies)[number]>().notNull(),
    isActive: boolean("is_active").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const cartItems = pgTable(
    "cart_items",
    {
        id: text("id").primaryKey(),
        cartId: text("cart_id")
            .notNull()
            .references(() => carts.id, { onDelete: "cascade" }),
        productCardId: text("product_card_id")
            .notNull()
            .references(() => productCards.id, { onDelete: "restrict" }),
        productId: text("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "restrict" }),
        productColorId: text("product_color_id")
            .notNull()
            .references(() => productColors.id, { onDelete: "restrict" }),
        quantity: integer("quantity").notNull(),
        createdAt: timestamp("created_at", { mode: "date" }).notNull(),
        updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
    },
    (table) => ({
        byCartProductColor: uniqueIndex("cart_items_cart_product_color_unique").on(
            table.cartId,
            table.productId,
            table.productColorId,
        ),
    }),
);

export const orderRequests = pgTable(
    "order_requests",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        idempotencyKey: text("idempotency_key").notNull(),
        status: text("status").$type<(typeof orderRequestStatuses)[number]>().notNull(),
        contactName: text("contact_name"),
        contactPhone: text("contact_phone"),
        contactEmail: text("contact_email"),
        contactTelegram: text("contact_telegram"),
        createdAt: timestamp("created_at", { mode: "date" }).notNull(),
        submittedAt: timestamp("submitted_at", { mode: "date" }),
        sentAt: timestamp("sent_at", { mode: "date" }),
        deliveryAttempts: integer("delivery_attempts").notNull(),
        nextDeliveryRetryAt: timestamp("next_delivery_retry_at", { mode: "date" }),
        lastDeliveryError: text("last_delivery_error"),
        updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
    },
    (table) => ({
        byUserIdempotency: uniqueIndex("order_requests_user_idempotency_unique").on(
            table.userId,
            table.idempotencyKey,
        ),
    }),
);

export const productSnapshots = pgTable("product_snapshots", {
    id: text("id").primaryKey(),
    orderRequestId: text("order_request_id")
        .notNull()
        .references(() => orderRequests.id, { onDelete: "cascade" }),
    productId: text("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    colorId: text("color_id")
        .notNull()
        .references(() => productColors.id, { onDelete: "restrict" }),
    colorName: text("color_name").notNull(),
    colorHex: text("color_hex").notNull(),
    imageIds: jsonb("image_ids").$type<string[]>().notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    thickness: integer("thickness").notNull(),
    quantity: integer("quantity").notNull(),
    price: integer("price").notNull(),
    currency: text("currency").$type<(typeof currencies)[number]>().notNull(),
    capturedAt: timestamp("captured_at", { mode: "date" }).notNull(),
});
