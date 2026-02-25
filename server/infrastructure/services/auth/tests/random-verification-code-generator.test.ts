import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { RandomVerificationCodeGenerator } from "~~/server/infrastructure/services/auth/RandomVerificationCodeGenerator";

describe("RandomVerificationCodeGenerator", () => {
    test("generates 6-digit numeric code", () => {
        const generator = new RandomVerificationCodeGenerator();
        const code = generator.generate();

        assert.match(code, /^\d{6}$/);
    });
});
