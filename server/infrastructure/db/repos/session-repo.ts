import { and, eq } from "drizzle-orm";
import { RepoResponse } from "~~/server/domain/base/types";
import { Session } from "~~/server/domain/session/entity";
import { SessionRepo } from "~~/server/domain/session/repo";
import { db } from "../connection";
import { sessions } from "../schema";
import { PgBaseRepo } from "./base";

export class PgSessionRepo extends PgBaseRepo<Session> implements SessionRepo {
    constructor() {
        super(sessions);
    }

    async getByRefreshFingerprint(parameters: {
        fingerprint: string;
    }): Promise<RepoResponse<Session | null>> {
        const [row] = await db
            .select()
            .from(sessions)
            .where(eq(sessions.refreshTokenFingerprint, parameters.fingerprint))
            .limit(1);

        return { data: (row as Session | undefined) ?? null, meta: undefined };
    }

    async updateIfVersion(parameters: {
        patch: Partial<Session> & { id: string };
        expectedVersion: number;
    }): Promise<RepoResponse<Session | null>> {
        const { id, ...patch } = parameters.patch;

        const [updated] = await db
            .update(sessions)
            .set(patch)
            .where(and(eq(sessions.id, id), eq(sessions.version, parameters.expectedVersion)))
            .returning();

        return { data: (updated as Session | undefined) ?? null, meta: undefined };
    }

    async revoke(parameters: { id: string; now: Date }): Promise<RepoResponse<boolean>> {
        const [updated] = await db
            .update(sessions)
            .set({ revokedAt: parameters.now, lastSeenAt: parameters.now })
            .where(eq(sessions.id, parameters.id))
            .returning({ id: sessions.id });

        return { data: Boolean(updated), meta: undefined };
    }
}
