import { BaseRepo } from "../base";
import { RepoResponse } from "../base/types";
import { Session } from "./entity";

export interface SessionRepo extends BaseRepo<Session> {
    getByRefreshFingerprint(parameters: {
        fingerprint: string;
    }): Promise<RepoResponse<Session | null>>;
    updateIfVersion(parameters: {
        patch: Partial<Session> & { id: string };
        expectedVersion: number;
    }): Promise<RepoResponse<Session | null>>;
    revoke(parameters: { id: string; now: Date }): Promise<RepoResponse<boolean>>;
}
