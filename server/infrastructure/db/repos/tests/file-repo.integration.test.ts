import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PgFileRepo } from "~~/server/infrastructure/db";
import { FIXED_NOW, setupDbTestHooks } from "./helpers";

setupDbTestHooks();

describe("PgFileRepo", () => {
    test("add/getById", async () => {
        const fileRepo = new PgFileRepo();

        await fileRepo.add({
            entity: {
                id: "file-1",
                url: "https://cdn.example.com/products/panel/file-1.jpg",
                storageProvider: null,
                storageBucket: null,
                storageKey: null,
                originalName: "panel.jpg",
                mimeType: "image/jpeg",
                sizeBytes: 123456,
                width: 1600,
                height: 900,
                createdAt: FIXED_NOW,
                updatedAt: FIXED_NOW,
            },
        });

        const file = await fileRepo.getById({ id: "file-1" });
        assert.equal(file.data?.id, "file-1");
        assert.equal(file.data?.url, "https://cdn.example.com/products/panel/file-1.jpg");
        assert.equal(file.data?.mimeType, "image/jpeg");
    });

    test("getByIds", async () => {
        const fileRepo = new PgFileRepo();

        await fileRepo.addMany({
            entities: [
                {
                    id: "file-1",
                    url: "https://cdn.example.com/products/panel/file-1.jpg",
                    storageProvider: null,
                    storageBucket: null,
                    storageKey: null,
                    originalName: "panel-1.jpg",
                    mimeType: "image/jpeg",
                    sizeBytes: 111,
                    width: 1200,
                    height: 800,
                    createdAt: FIXED_NOW,
                    updatedAt: FIXED_NOW,
                },
                {
                    id: "file-2",
                    url: "https://cdn.example.com/products/panel/file-2.jpg",
                    storageProvider: null,
                    storageBucket: null,
                    storageKey: null,
                    originalName: "panel-2.jpg",
                    mimeType: "image/jpeg",
                    sizeBytes: 222,
                    width: 1600,
                    height: 900,
                    createdAt: FIXED_NOW,
                    updatedAt: FIXED_NOW,
                },
            ],
        });

        const files = await fileRepo.getByIds({ ids: ["file-2", "missing", "file-1"] });

        assert.equal(files.data.length, 2);
        const ids = files.data.map((item) => item.id);
        assert.equal(ids.includes("file-1"), true);
        assert.equal(ids.includes("file-2"), true);
    });
});
