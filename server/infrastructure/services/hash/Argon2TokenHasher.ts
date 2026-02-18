import argon2 from "argon2";
import { TokenHasher } from "~~/server/shared/hash";

export class Argon2TokenHasher implements TokenHasher {
    async hash(token: string): Promise<string> {
        return argon2.hash(token);
    }

    async verify(hash: string, token: string): Promise<boolean> {
        return argon2.verify(hash, token);
    }
}
