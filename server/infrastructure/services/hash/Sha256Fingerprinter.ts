import { createHash } from "node:crypto";
import { Fingerprinter } from "~~/server/shared/hash";

export class Sha256Fingerprinter implements Fingerprinter {
    fingerprint(input: string): string {
        return createHash("sha256").update(input).digest("hex");
    }
}
