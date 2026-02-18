import { inArray } from "drizzle-orm";
import { RepoResponse } from "~~/server/domain/base/types";
import { File } from "~~/server/domain/file/entity";
import { FileRepo } from "~~/server/domain/file/repo";
import { db } from "../connection";
import { files } from "../schema";
import { PgBaseRepo } from "./base";

export class PgFileRepo extends PgBaseRepo<File> implements FileRepo {
    constructor() {
        super(files);
    }

    async getByIds(parameters: { ids: string[] }): Promise<RepoResponse<File[]>> {
        if (parameters.ids.length === 0) {
            return { data: [], meta: undefined };
        }

        const rows = await db.select().from(files).where(inArray(files.id, parameters.ids));
        return { data: rows as File[], meta: undefined };
    }
}

