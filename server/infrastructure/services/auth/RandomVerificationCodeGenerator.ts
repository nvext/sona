import { randomInt } from "node:crypto";
import type { VerificationCodeGenerator } from "~~/server/application/auth/services/verification-code-generator";

export class RandomVerificationCodeGenerator implements VerificationCodeGenerator {
    generate(): string {
        return randomInt(0, 1_000_000).toString().padStart(6, "0");
    }
}
