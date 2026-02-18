import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

loadEnv();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for drizzle config");
}

export default defineConfig({
    schema: "./server/infrastructure/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    strict: true,
    verbose: true,
});
