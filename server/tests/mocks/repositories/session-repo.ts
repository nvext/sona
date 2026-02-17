import type { RepoResponse } from "~~/server/domain/base/types";
import type { Session } from "~~/server/domain/session/entity";
import type { SessionRepo } from "~~/server/domain/session/repo";

export class InMemorySessionRepo implements SessionRepo {
    added: Session[] = [];

    async add(parameters: { entity: Session }): Promise<RepoResponse<Session>> {
        this.added.push(parameters.entity);
        return { data: parameters.entity, meta: undefined };
    }

    async getByRefreshFingerprint(): Promise<RepoResponse<Session | null>> {
        return { data: null, meta: undefined };
    }
    async updateIfVersion(): Promise<RepoResponse<Session | null>> {
        return { data: null, meta: undefined };
    }
    async revoke(): Promise<RepoResponse<boolean>> {
        return { data: true, meta: undefined };
    }
    async addMany(): Promise<RepoResponse<Session[]>> {
        throw new Error("not implemented");
    }
    async getById(): Promise<RepoResponse<Session | null>> {
        throw new Error("not implemented");
    }
    async get(): Promise<RepoResponse<Session[], { pagination: { offset: number; limit: number }; total: number }>> {
        throw new Error("not implemented");
    }
    async update(): Promise<RepoResponse<Session | null>> {
        throw new Error("not implemented");
    }
    async delete(): Promise<RepoResponse<Session | null>> {
        throw new Error("not implemented");
    }
}
