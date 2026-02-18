import { asc, count, desc, eq } from "drizzle-orm";
import { BaseRepo } from "~~/server/domain/base";
import { RepoResponse } from "~~/server/domain/base/types";
import { Pagination, Sorting } from "~~/server/shared/types";
import { db } from "../connection";

type RowWithId = { id: string };

export abstract class PgBaseRepo<TEntity extends RowWithId> implements BaseRepo<TEntity> {
    protected constructor(protected readonly table: any) {}

    async add(parameters: { entity: TEntity }): Promise<RepoResponse<TEntity>> {
        const created = (await db.insert(this.table).values(parameters.entity).returning()) as TEntity[];

        return { data: created[0], meta: undefined };
    }

    async addMany(parameters: { entities: TEntity[] }): Promise<RepoResponse<TEntity[]>> {
        if (parameters.entities.length === 0) {
            return { data: [], meta: undefined };
        }

        const created = (await db.insert(this.table).values(parameters.entities).returning()) as TEntity[];
        return { data: created, meta: undefined };
    }

    async getById(parameters: { id: string }): Promise<RepoResponse<TEntity | null>> {
        const rows = (await db
            .select()
            .from(this.table)
            .where(eq(this.table.id, parameters.id))
            .limit(1)) as TEntity[];

        return { data: rows[0] ?? null, meta: undefined };
    }

    async get(parameters: {
        query?: string;
        sorting?: Sorting<TEntity>;
        pagination?: Pagination;
    }): Promise<RepoResponse<TEntity[], { pagination: Pagination; total: number }>> {
        const pagination = parameters.pagination ?? { offset: 0, limit: 50 };

        const rows = (await db
            .select()
            .from(this.table)
            .limit(pagination.limit)
            .offset(pagination.offset)) as TEntity[];

        let sorted = rows;
        if (parameters.sorting && parameters.sorting.length > 0) {
            sorted = await this.getSorted(parameters.sorting, pagination);
        }

        const totalRows = (await db.select({ total: count() }).from(this.table)) as Array<{
            total: number | string;
        }>;
        const total = Number(totalRows[0]?.total ?? 0);

        return {
            data: sorted,
            meta: {
                pagination,
                total,
            },
        };
    }

    async update(parameters: {
        patch: Partial<TEntity> & { id: string };
    }): Promise<RepoResponse<TEntity | null>> {
        const { id, ...patch } = parameters.patch;

        const updated = (await db.update(this.table).set(patch).where(eq(this.table.id, id)).returning()) as TEntity[];

        return { data: updated[0] ?? null, meta: undefined };
    }

    async delete(parameters: { id: string }): Promise<RepoResponse<TEntity | null>> {
        const deleted = (await db
            .delete(this.table)
            .where(eq(this.table.id, parameters.id))
            .returning()) as TEntity[];

        return { data: deleted[0] ?? null, meta: undefined };
    }

    private async getSorted(
        sorting: Sorting<TEntity>,
        pagination: Pagination,
    ): Promise<TEntity[]> {
        let query = db.select().from(this.table).$dynamic();

        for (const item of sorting) {
            const column = this.table[item.field];
            if (!column) {
                continue;
            }
            query = query.orderBy(item.direction === "asc" ? asc(column) : desc(column));
        }

        const rows = (await query.limit(pagination.limit).offset(pagination.offset)) as TEntity[];
        return rows;
    }
}
