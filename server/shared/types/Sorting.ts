export type Sorting<TEntity> = SortingItem<TEntity>[];

type SortingItem<TEntity> = {
    field: keyof TEntity & string;
    direction: "asc" | "desc";
};