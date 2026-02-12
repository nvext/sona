import { Pagination, RepoResponse, Sorting } from "./types";

export interface BaseRepo<TEntity> {
    add(parameters: { entity: TEntity }): Promise<RepoResponse<TEntity>>;
    getById(parameters: { id: string }): Promise<RepoResponse<TEntity | null>>;
    get(parameters: {
        query?: string;
        sorting?: Sorting<TEntity>;
        pagination?: Pagination;
    }): Promise<RepoResponse<TEntity[], { pagination: Pagination; total: number }>>;
    update(parameters: {
        patch: Partial<TEntity> & { id: string };
    }): Promise<RepoResponse<TEntity | null>>;
    delete(parameters: { id: string }): Promise<RepoResponse<TEntity | null>>;
}
