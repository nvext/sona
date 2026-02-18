import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { UuidGenerator } from "~~/server/infrastructure/services/id/UuidGenerator";

describe("UuidGenerator", () => {
    test("generates non-empty and mostly unique ids", () => {
        const generator = new UuidGenerator();
        const ids = new Set<string>();

        for (let i = 0; i < 50; i++) {
            const id = generator.generate();
            assert.ok(id.length > 0);
            ids.add(id);
        }

        assert.equal(ids.size, 50);
    });
});
