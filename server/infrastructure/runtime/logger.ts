type LogLevel = "info" | "error";

type RuntimeLogLevel = "silent" | "error" | "info";

function parseLogLevel(value: string | undefined): RuntimeLogLevel | null {
    const configured = (value ?? "").trim().toLowerCase();
    if (configured === "silent" || configured === "error" || configured === "info") {
        return configured;
    }
    return null;
}

function resolveRuntimeLogLevel(): RuntimeLogLevel {
    const isTestRun =
        process.env.NODE_ENV === "test" ||
        process.argv.includes("test") ||
        process.argv.some((arg) => arg.includes("bun:test"));

    if (isTestRun) {
        const testLevel = parseLogLevel(process.env.TEST_LOG_LEVEL);
        if (testLevel !== null) {
            return testLevel;
        }
    }

    const defaultLevel = parseLogLevel(process.env.LOG_LEVEL);
    if (defaultLevel !== null) {
        return defaultLevel;
    }

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
