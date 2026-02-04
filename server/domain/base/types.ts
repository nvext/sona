export type RepoResponse<TData, TMeta = undefined> = {
    data: TData;
    meta: TMeta;
};

export type Sorting<TEntity> = SortingItem<TEntity>[];

type SortingItem<TEntity> = {
    field: keyof TEntity & string;
    direction: "asc" | "desc";
};

export type Pagination = {
    offset: number;
    limit: number;
};
