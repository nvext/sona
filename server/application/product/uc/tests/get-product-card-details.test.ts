import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { GetProductCardDetails } from "~~/server/application/product/uc/get-product-card-details";
import type { ProductCardRepo } from "~~/server/domain/product-card/repo";
import type { ProductColorRepo } from "~~/server/domain/product-color/repo";
import type { ProductRepo } from "~~/server/domain/product/repo";
import type { FileRepo } from "~~/server/domain/file/repo";
import type { ProductCard } from "~~/server/domain/product-card/entity";
import type { ProductColor } from "~~/server/domain/product-color/entity";
import type { Product } from "~~/server/domain/product/entity";
import type { File } from "~~/server/domain/file/entity";
import { NotFoundError } from "~~/server/shared/errors";

const baseCard: ProductCard = {
    id: "card-1",
    type: "panel",
    slug: "panel-1",
    title: "Panel 1",
    description: "desc",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const baseColor: ProductColor = {
    id: "color-1",
    productCardId: "card-1",
    name: "Black",
    hex: "#000000",
    imageIds: ["img-1"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const baseProduct: Product = {
    id: "product-1",
    cardId: "card-1",
    productColorId: "color-1",
    width: 100,
    height: 100,
    thickness: 10,
    price: 1000,
    currency: "RUB",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const baseFile: File = {
    id: "img-1",
    url: "https://cdn.example.com/img-1.jpg",
    storageProvider: null,
    storageBucket: null,
    storageKey: null,
    originalName: "img-1.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 123,
    width: 1000,
    height: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe("GetProductCardDetails", () => {
    test("returns card details with colors and products", async () => {
        const productCardRepo = {
            async getById() {
                return { data: baseCard, meta: undefined };
            },
        } as unknown as ProductCardRepo;

        const productColorRepo = {
            async getByProductCardId() {
                return { data: [baseColor], meta: undefined };
            },
        } as unknown as ProductColorRepo;

        const productRepo = {
            async getByProductCardId() {
                return { data: [baseProduct], meta: undefined };
            },
        } as unknown as ProductRepo;

        const fileRepo = {
            async getByIds() {
                return { data: [baseFile], meta: undefined };
            },
        } as unknown as FileRepo;

        const uc = new GetProductCardDetails(productCardRepo, productColorRepo, productRepo, fileRepo);
        const result = await uc.execute({ cardId: "card-1" });

        assert.equal(result.card.id, "card-1");
        assert.equal(result.colors.length, 1);
        assert.equal(result.colors[0].images.length, 1);
        assert.equal(result.colors[0].images[0].url, baseFile.url);
        assert.equal("imageIds" in result.colors[0], false);
        assert.equal(result.products.length, 1);
    });

    test("throws NotFoundError when card does not exist", async () => {
        const productCardRepo = {
            async getById() {
                return { data: null, meta: undefined };
            },
        } as unknown as ProductCardRepo;

        const productColorRepo = {} as ProductColorRepo;
        const productRepo = {} as ProductRepo;
        const fileRepo = {} as FileRepo;

        const uc = new GetProductCardDetails(productCardRepo, productColorRepo, productRepo, fileRepo);
        await assert.rejects(uc.execute({ cardId: "missing-card" }), NotFoundError);
    });
});
