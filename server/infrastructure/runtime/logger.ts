type LogLevel = "info" | "error";

type RuntimeLogLevel = "silent" | "error" | "info";

function resolveRuntimeLogLevel(): RuntimeLogLevel {
    const configured = (process.env.LOG_LEVEL ?? "").trim().toLowerCase();
    if (configured === "silent" || configured === "error" || configured === "info") {
        return configured;
    }

    const isTestRun =
        process.env.NODE_ENV === "test" ||
        process.argv.includes("test") ||
        process.argv.some((arg) => arg.includes("bun:test"));

    return isTestRun ? "silent" : "info";
}

function writeLog(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    const runtimeLogLevel = resolveRuntimeLogLevel();
    if (runtimeLogLevel === "silent") {
        return;
    }
    if (runtimeLogLevel === "error" && level !== "error") {
        return;
    }

    const payload = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(fields ?? {}),
    };

    const serialized = JSON.stringify(payload);
    if (level === "error") {
        console.error(serialized);
    } else {
        console.log(serialized);
    }
}

export function logInfo(message: string, fields?: Record<string, unknown>): void {
    writeLog("info", message, fields);
}

export function logError(message: string, fields?: Record<string, unknown>): void {
    writeLog("error", message, fields);
}
