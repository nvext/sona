import { BaseRepo } from "../base";
import { RepoResponse } from "../base/types";
import { User } from "./entity";

export interface UserRepo extends BaseRepo<User> {
    getByPhone(parameters: { phone: string }): Promise<RepoResponse<User | null>>;
    getByEmail(parameters: { email: string }): Promise<RepoResponse<User | null>>;
}
