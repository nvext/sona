import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Argon2PasswordHasher } from "~~/server/infrastructure/services/hash/Argon2PasswordHasher";
import { Argon2TokenHasher } from "~~/server/infrastructure/services/hash/Argon2TokenHasher";
import { Sha256Fingerprinter } from "~~/server/infrastructure/services/hash/Sha256Fingerprinter";

describe("hash services", () => {
    test("Argon2PasswordHasher hashes and verifies password", async () => {
        const hasher = new Argon2PasswordHasher();
        const hash = await hasher.hash("secret");

        assert.equal(await hasher.verify(hash, "secret"), true);
        assert.equal(await hasher.verify(hash, "wrong"), false);
    });

    test("Argon2TokenHasher hashes and verifies token", async () => {
        const hasher = new Argon2TokenHasher();
        const hash = await hasher.hash("token-1");

        assert.equal(await hasher.verify(hash, "token-1"), true);
        assert.equal(await hasher.verify(hash, "token-2"), false);
    });

    test("Sha256Fingerprinter is deterministic", () => {
        const fingerprinter = new Sha256Fingerprinter();
        const first = fingerprinter.fingerprint("abc");
        const second = fingerprinter.fingerprint("abc");
        const third = fingerprinter.fingerprint("xyz");

        assert.equal(first, second);
        assert.notEqual(first, third);
        assert.equal(first.length, 64);
    });
});
