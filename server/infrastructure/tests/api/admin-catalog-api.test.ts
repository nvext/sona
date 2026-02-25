import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "~~/server/infrastructure/db/connection";
import { users } from "~~/server/infrastructure/db/schema";
import cardsHandler from "~~/server/infrastructure/api/admin/catalog/cards.get";
import createCardHandler from "~~/server/infrastructure/api/admin/catalog/cards.post";
import patchCardHandler from "~~/server/infrastructure/api/admin/catalog/cards/[cardId].patch";
import deleteCardHandler from "~~/server/infrastructure/api/admin/catalog/cards/[cardId].delete";
import createColorHandler from "~~/server/infrastructure/api/admin/catalog/cards/[cardId]/colors.post";
import generateProductsHandler from "~~/server/infrastructure/api/admin/catalog/cards/[cardId]/products/generate.post";
import patchColorHandler from "~~/server/infrastructure/api/admin/catalog/colors/[colorId].patch";
import patchProductHandler from "~~/server/infrastructure/api/admin/catalog/products/[productId].patch";
import publishHandler from "~~/server/infrastructure/api/admin/catalog/publish.post";
import previewHandler from "~~/server/infrastructure/api/admin/catalog/publish/preview.get";
import createFileHandler from "~~/server/infrastructure/api/admin/files.post";
import { callApi } from "./helpers";

async function createAdminUser() {
    const now = new Date();
    const userId = `admin-${randomUUID()}`;
    await db.insert(users).values({
        id: userId,
        name: "Test Admin",
        email: `${userId}@example.com`,
        phone: null,
        role: "admin",
        emailVerifiedAt: now,
        phoneVerifiedAt: null,
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationRequestedAt: null,
        phoneVerificationCodeHash: null,
        phoneVerificationExpiresAt: null,
        phoneVerificationRequestedAt: null,
        passwordHash: "test",
        createdAt: now,
        updatedAt: now,
        sessionVersion: 1,
        status: "active",
    });

    return userId;
}

describe("infra admin catalog api", () => {
    test("GET /admin/catalog/cards returns 403 for non-admin", async () => {
        const response = await callApi({
            route: "/admin/catalog/cards",
            requestPath: "/admin/catalog/cards",
            handler: cardsHandler as any,
            context: {
                auth: { userId: "user-1" },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: {
                                id: "user-1",
                                status: "active",
                                role: "customer",
                            },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(response.status, 403);
    });

    test("GET /admin/catalog/cards returns 200 for admin", async () => {
        const response = await callApi({
            route: "/admin/catalog/cards",
            requestPath: "/admin/catalog/cards",
            handler: cardsHandler as any,
            context: {
                auth: { userId: "user-1" },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: {
                                id: "user-1",
                                status: "active",
                                role: "admin",
                            },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(response.status, 200);
        assert.ok(Array.isArray(response.body.items));
        assert.ok(typeof response.body.pagination?.total === "number");
    });

    test("GET /admin/catalog/publish/preview validates draftId", async () => {
        const response = await callApi({
            route: "/admin/catalog/publish/preview",
            requestPath: "/admin/catalog/publish/preview",
            handler: previewHandler as any,
            context: {
                auth: { userId: "user-1" },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: {
                                id: "user-1",
                                status: "active",
                                role: "admin",
                            },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(response.status, 400);
    });

    test("POST/PATCH /admin/catalog/cards writes staging draft", async () => {
        const userId = await createAdminUser();
        const slug = `admin-test-${randomUUID().slice(0, 8)}`;
        const createResponse = await callApi({
            route: "/admin/catalog/cards",
            requestPath: "/admin/catalog/cards",
            method: "POST",
            handler: createCardHandler as any,
            body: {
                slug,
                title: "Admin Test Card",
                type: "panel",
                description: "Card created from api test",
                isActive: true,
            },
            context: {
                auth: { userId },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: {
                                id: userId,
                                status: "active",
                                role: "admin",
                            },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(createResponse.status, 200);
        assert.equal(typeof createResponse.body.draftId, "string");
        assert.equal(createResponse.body.card.slug, slug);

        const patchResponse = await callApi({
            route: "/admin/catalog/cards/:cardId",
            requestPath: `/admin/catalog/cards/${createResponse.body.card.id}`,
            method: "PATCH",
            handler: patchCardHandler as any,
            body: {
                draftId: createResponse.body.draftId,
                title: "Admin Test Card Updated",
            },
            context: {
                auth: { userId },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: {
                                id: userId,
                                status: "active",
                                role: "admin",
                            },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(patchResponse.status, 200);
        assert.equal(patchResponse.body.card.title, "Admin Test Card Updated");
        assert.equal(patchResponse.body.draftId, createResponse.body.draftId);
    });

    test("POST/PATCH color in staging", async () => {
        const userId = await createAdminUser();
        const slug = `admin-color-${randomUUID().slice(0, 8)}`;
        const cardResponse = await callApi({
            route: "/admin/catalog/cards",
            requestPath: "/admin/catalog/cards",
            method: "POST",
            handler: createCardHandler as any,
            body: {
                slug,
                title: "Admin Color Card",
                type: "panel",
                description: "Card for color test",
                isActive: true,
            },
            context: {
                auth: { userId },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: {
                                id: userId,
                                status: "active",
                                role: "admin",
                            },
                            meta: undefined,
                        }),
                    },
                },
            },
        });
        assert.equal(cardResponse.status, 200);

        const fileResponse = await callApi({
            route: "/admin/files",
            requestPath: "/admin/files",
            method: "POST",
            handler: createFileHandler as any,
            body: {
                draftId: cardResponse.body.draftId,
                url: `/uploads/admin/${randomUUID()}.png`,
                originalName: "file.png",
                mimeType: "image/png",
                sizeBytes: 12,
            },
            context: {
                auth: { userId },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: {
                                id: userId,
                                status: "active",
                                role: "admin",
                            },
                            meta: undefined,
                        }),
                    },
                },
            },
        });
        assert.equal(fileResponse.status, 200);

        const createColorResponse = await callApi({
            route: "/admin/catalog/cards/:cardId/colors",
            requestPath: `/admin/catalog/cards/${cardResponse.body.card.id}/colors`,
            method: "POST",
            handler: createColorHandler as any,
            body: {
                draftId: cardResponse.body.draftId,
                name: "Graphite",
                hex: "#222222",
                imageIds: [fileResponse.body.file.id],
                isActive: true,
            },
            context: {
                auth: { userId },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: {
                                id: userId,
                                status: "active",
                                role: "admin",
                            },
                            meta: undefined,
                        }),
                    },
                },
            },
        });
        assert.equal(createColorResponse.status, 200);

        const patchColorResponse = await callApi({
            route: "/admin/catalog/colors/:colorId",
            requestPath: `/admin/catalog/colors/${createColorResponse.body.color.id}`,
            method: "PATCH",
            handler: patchColorHandler as any,
            body: {
                draftId: cardResponse.body.draftId,
                name: "Graphite Updated",
            },
            context: {
                auth: { userId },
            },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: {
                                id: userId,
                                status: "active",
                                role: "admin",
                            },
                            meta: undefined,
                        }),
                    },
                },
            },
        });
        assert.equal(patchColorResponse.status, 200);
        assert.equal(patchColorResponse.body.color.name, "Graphite Updated");
    });

    test("DELETE /admin/catalog/cards/:cardId removes staged card", async () => {
        const userId = await createAdminUser();
        const createResponse = await callApi({
            route: "/admin/catalog/cards",
            requestPath: "/admin/catalog/cards",
            method: "POST",
            handler: createCardHandler as any,
            body: {
                slug: `admin-delete-${randomUUID().slice(0, 8)}`,
                title: "Delete me",
                type: "panel",
                description: "Will be deleted",
                isActive: true,
            },
            context: { auth: { userId } },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: userId, status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });
        assert.equal(createResponse.status, 200);

        const deleteResponse = await callApi({
            route: "/admin/catalog/cards/:cardId",
            requestPath: `/admin/catalog/cards/${createResponse.body.card.id}`,
            method: "DELETE",
            query: { draftId: createResponse.body.draftId },
            handler: deleteCardHandler as any,
            context: { auth: { userId } },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: userId, status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(deleteResponse.status, 200);
        assert.equal(deleteResponse.body.deleted, true);
    });

    test("POST /admin/catalog/cards/:cardId/products/generate + PATCH product", async () => {
        const userId = await createAdminUser();
        const cardResponse = await callApi({
            route: "/admin/catalog/cards",
            requestPath: "/admin/catalog/cards",
            method: "POST",
            handler: createCardHandler as any,
            body: {
                slug: `admin-sku-${randomUUID().slice(0, 8)}`,
                title: "SKU card",
                type: "panel",
                description: "sku generation",
                isActive: true,
            },
            context: { auth: { userId } },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: userId, status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });
        assert.equal(cardResponse.status, 200);

        const colorResponse = await callApi({
            route: "/admin/catalog/cards/:cardId/colors",
            requestPath: `/admin/catalog/cards/${cardResponse.body.card.id}/colors`,
            method: "POST",
            handler: createColorHandler as any,
            body: {
                draftId: cardResponse.body.draftId,
                name: "Black",
                hex: "#000000",
                imageIds: [],
                isActive: true,
            },
            context: { auth: { userId } },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: userId, status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });
        assert.equal(colorResponse.status, 200);

        const generateResponse = await callApi({
            route: "/admin/catalog/cards/:cardId/products/generate",
            requestPath: `/admin/catalog/cards/${cardResponse.body.card.id}/products/generate`,
            method: "POST",
            handler: generateProductsHandler as any,
            body: {
                draftId: cardResponse.body.draftId,
                sizes: [{ width: 600, height: 600 }],
                thicknesses: [18, 25],
                price: 1000,
                currency: "RUB",
            },
            context: { auth: { userId } },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: userId, status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });
        assert.equal(generateResponse.status, 200);
        assert.equal(generateResponse.body.generated, 2);

        const productId = `${cardResponse.body.card.id}-${colorResponse.body.color.id}-600x600x18`;
        const patchProductResponse = await callApi({
            route: "/admin/catalog/products/:productId",
            requestPath: `/admin/catalog/products/${productId}`,
            method: "PATCH",
            handler: patchProductHandler as any,
            body: {
                draftId: cardResponse.body.draftId,
                price: 1400,
                isActive: false,
            },
            context: { auth: { userId } },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: userId, status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(patchProductResponse.status, 200);
        assert.equal(patchProductResponse.body.product.price, 1400);
        assert.equal(patchProductResponse.body.product.isActive, false);
    });

    test("POST /admin/catalog/publish publishes open draft", async () => {
        const userId = await createAdminUser();
        const cardResponse = await callApi({
            route: "/admin/catalog/cards",
            requestPath: "/admin/catalog/cards",
            method: "POST",
            handler: createCardHandler as any,
            body: {
                slug: `admin-publish-${randomUUID().slice(0, 8)}`,
                title: "Publish card",
                type: "panel",
                description: "publish test",
                isActive: true,
            },
            context: { auth: { userId } },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: userId, status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });
        assert.equal(cardResponse.status, 200);

        const publishResponse = await callApi({
            route: "/admin/catalog/publish",
            requestPath: "/admin/catalog/publish",
            method: "POST",
            handler: publishHandler as any,
            body: {
                draftId: cardResponse.body.draftId,
            },
            context: { auth: { userId } },
            container: {
                repos: {
                    userRepo: {
                        getById: async () => ({
                            data: { id: userId, status: "active", role: "admin" },
                            meta: undefined,
                        }),
                    },
                },
            },
        });

        assert.equal(publishResponse.status, 200);
        assert.equal(publishResponse.body.ok, true);
        assert.equal(publishResponse.body.draftId, cardResponse.body.draftId);
    });
});
