import type { EntityIdGenerator, UniqueIdGenerator } from "~~/server/shared/id";

export class StubEntityIdGenerator implements EntityIdGenerator {
    generate(): string {
        return "session-id-1";
    }
}

export class StubUniqueIdGenerator implements UniqueIdGenerator {
    generate(): string {
        return "family-id-1";
    }
}
