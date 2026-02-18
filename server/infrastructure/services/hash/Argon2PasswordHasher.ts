import argon2 from "argon2";
import { PasswordHasher } from "~~/server/shared/hash";

export class Argon2PasswordHasher implements PasswordHasher {
    async hash(password: string): Promise<string> {
        return argon2.hash(password);
    }

    async verify(hash: string, password: string): Promise<boolean> {
        return argon2.verify(hash, password);
    }
}
