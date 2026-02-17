import type { RepoResponse } from "~~/server/domain/base/types";
import type { User } from "~~/server/domain/user/entity";
import type { UserRepo } from "~~/server/domain/user/repo";

export class InMemoryUserRepo implements UserRepo {
    constructor(private readonly user: User | null) {}

    async getByEmail(): Promise<RepoResponse<User | null>> {
        return { data: this.user, meta: undefined };
    }

    async getByPhone(): Promise<RepoResponse<User | null>> {
        return { data: this.user, meta: undefined };
    }

    async add(): Promise<RepoResponse<User>> {
        throw new Error("not implemented");
    }
    async addMany(): Promise<RepoResponse<User[]>> {
        throw new Error("not implemented");
    }
    async getById(): Promise<RepoResponse<User | null>> {
        throw new Error("not implemented");
    }
    async get(): Promise<RepoResponse<User[], { pagination: { offset: number; limit: number }; total: number }>> {
        throw new Error("not implemented");
    }
    async update(): Promise<RepoResponse<User | null>> {
        throw new Error("not implemented");
    }
    async delete(): Promise<RepoResponse<User | null>> {
        throw new Error("not implemented");
    }
}
