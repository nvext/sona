import { randomUUID } from "node:crypto";
import { EntityIdGenerator, UniqueIdGenerator } from "~~/server/shared/id";

export class UuidGenerator implements EntityIdGenerator, UniqueIdGenerator {
    generate(): string {
        return randomUUID();
    }
}
