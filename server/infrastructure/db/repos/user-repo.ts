import { eq } from "drizzle-orm";
import { RepoResponse } from "~~/server/domain/base/types";
import { User } from "~~/server/domain/user/entity";
import { UserRepo } from "~~/server/domain/user/repo";
import { db } from "../connection";
import { users } from "../schema";
import { PgBaseRepo } from "./base";

export class PgUserRepo extends PgBaseRepo<User> implements UserRepo {
    constructor() {
        super(users);
    }

    async getByPhone(parameters: { phone: string }): Promise<RepoResponse<User | null>> {
        const [row] = await db.select().from(users).where(eq(users.phone, parameters.phone)).limit(1);
        return { data: (row as User | undefined) ?? null, meta: undefined };
    }

    async getByEmail(parameters: { email: string }): Promise<RepoResponse<User | null>> {
        const [row] = await db.select().from(users).where(eq(users.email, parameters.email)).limit(1);
        return { data: (row as User | undefined) ?? null, meta: undefined };
    }
}
