import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { readRuntimeEnv } from "~~/server/infrastructure/runtime/env";

const connectionString = readRuntimeEnv().databaseUrl;

const pool = new Pool({
    connectionString,
});

export const db = drizzle(pool, { schema });
export { pool };
