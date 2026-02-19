import { createError } from "h3";
import { defineApiHandler } from "../http/api/handler";
import { pool } from "~~/server/infrastructure/db";

type ApiEventContext = {
    databaseReady?: () => Promise<void>;
};

export default defineApiHandler(async (event) => {
    const context = event.context as ApiEventContext;
    const ping = context.databaseReady ?? (async () => {
        await pool.query("select 1");
    });

    try {
        await ping();
        return {
            status: "ready",
            database: "ok",
            timestamp: new Date().toISOString(),
        };
    } catch {
        throw createError({
            statusCode: 503,
            statusMessage: "Service Unavailable",
            data: {
                database: "unavailable",
            },
        });
    }
});
