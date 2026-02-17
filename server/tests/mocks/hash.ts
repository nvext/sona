import type { Fingerprinter, PasswordHasher, TokenHasher } from "~~/server/shared/hash";

export type VerifyCall = { hash: string; password: string };

export class StubPasswordHasher implements PasswordHasher {
    verifyCalls: VerifyCall[] = [];

    constructor(private readonly verifyResult: boolean) {}

    async hash(): Promise<string> {
        throw new Error("not implemented");
    }

    async verify(hash: string, password: string): Promise<boolean> {
        this.verifyCalls.push({ hash, password });
        return this.verifyResult;
    }
}

export class StubTokenHasher implements TokenHasher {
    async hash(token: string): Promise<string> {
        return `hashed:${token}`;
    }
    async verify(): Promise<boolean> {
        throw new Error("not implemented");
    }
}

export class StubFingerprinter implements Fingerprinter {
    fingerprint(input: string): string {
        return `fp:${input}`;
    }
}
