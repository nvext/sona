import { BaseRepo } from "../base";
import { RepoResponse } from "../base/types";
import { File } from "./entity";

export interface FileRepo extends BaseRepo<File> {
    getByIds(parameters: { ids: string[] }): Promise<RepoResponse<File[]>>;
}

