type LogLevel = "info" | "error";

type RuntimeLogLevel = "silent" | "error" | "info";

const ANSI = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    bgGreen: "\x1b[42m",
    bgRed: "\x1b[41m",
} as const;

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

type ColorMode = "auto" | "always" | "never";

function resolveColorMode(): ColorMode {
    const configured = (process.env.LOG_COLOR ?? "").trim().toLowerCase();
    if (configured === "always" || configured === "on" || configured === "1" || configured === "true") {
        return "always";
    }
    if (configured === "never" || configured === "off" || configured === "0" || configured === "false") {
        return "never";
    }
    return "auto";
}

function supportsColor(level: LogLevel): boolean {
    const mode = resolveColorMode();
    if (mode === "always") {
        return true;
    }
    if (mode === "never") {
        return false;
    }

    if (process.env.NO_COLOR !== undefined || process.env.CLICOLOR === "0" || process.env.TERM === "dumb") {
        return false;
    }

    if (process.env.NODE_ENV === "development") {
        return true;
    }

    if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== "0") {
        return true;
    }
    const stream = level === "error" ? process.stderr : process.stdout;
    return Boolean(stream?.isTTY);
}

function paint(value: string, color: string, enabled: boolean): string {
    if (!enabled || color.length === 0) {
        return value;
    }
    return `${color}${value}${ANSI.reset}`;
}

const FIELD_ORDER: string[] = [
    "requestId",
    "method",
    "path",
    "statusCode",
    "statusMessage",
    "durationMs",
    "userId",
    "orderRequestId",
    "status",
    "failedCount",
    "batchSize",
    "maxAttempts",
    "attempts",
    "nextRetryAt",
    "errorMessage",
];

function fieldOrderIndex(key: string): number {
    const index = FIELD_ORDER.indexOf(key);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function normalizeFieldValue(key: string, value: unknown): unknown {
    if (key === "durationMs" && typeof value === "number") {
        return `${value}ms`;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return value;
}

function stringifyFieldValue(value: unknown): string {
    if (value === null) {
        return "null";
    }

    const valueType = typeof value;
    if (valueType === "string") {
        const text = value as string;
        return /[\s"'=]/.test(text) ? JSON.stringify(text) : text;
    }
    if (valueType === "number" || valueType === "boolean" || valueType === "bigint") {
        return String(value);
    }

    const serialized = JSON.stringify(value);
    return serialized ?? String(value);
}

function toOrderedEntries(fields?: Record<string, unknown>): Array<[string, unknown]> {
    if (!fields) {
        return [];
    }

    return Object.entries(fields)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, normalizeFieldValue(key, value)] as const)
        .sort(([leftKey], [rightKey]) => {
            const leftOrder = fieldOrderIndex(leftKey);
            const rightOrder = fieldOrderIndex(rightKey);
            if (leftOrder === rightOrder) {
                return leftKey.localeCompare(rightKey);
            }
            return leftOrder - rightOrder;
        });
}

function takeEntryValue(entries: Array<[string, unknown]>, key: string): unknown | null {
    const index = entries.findIndex(([entryKey]) => entryKey === key);
    if (index === -1) {
        return null;
    }

    const [, value] = entries[index];
    entries.splice(index, 1);
    return value;
}

function resolveValueColor(key: string, value: unknown): string {
    if (key === "statusCode") {
        const statusCode = typeof value === "number" ? value : Number(value);
        if (!Number.isNaN(statusCode)) {
            if (statusCode >= 500) {
                return ANSI.red;
            }
            if (statusCode >= 400) {
                return ANSI.yellow;
            }
            if (statusCode >= 200) {
                return ANSI.green;
            }
        }
    }

    if (key === "durationMs") {
        return ANSI.gray;
    }
    if (key === "path") {
        return ANSI.blue;
    }
    if (key === "method") {
        return ANSI.magenta;
    }
    if (key === "errorMessage" || key === "statusMessage") {
        return ANSI.red;
    }

    return "";
}

function formatFields(entries: Array<[string, unknown]>, colorized: boolean): string {
    if (entries.length === 0) {
        return "";
    }

    return entries
        .map(([key, value]) => {
            const renderedKey = paint(key, ANSI.dim + ANSI.cyan, colorized);
            const renderedValue = stringifyFieldValue(value);
            const valueColor = resolveValueColor(key, value);
            return `${renderedKey}=${paint(renderedValue, valueColor, colorized)}`;
        })
        .join(" ");
}

function formatLevel(level: LogLevel, colorized: boolean): string {
    if (level === "error") {
        return paint(" ERROR ", ANSI.bold + ANSI.black + ANSI.bgRed, colorized);
    }
    return paint(" INFO ", ANSI.bold + ANSI.black + ANSI.bgGreen, colorized);
}

function formatCore(
    level: LogLevel,
    message: string,
    entries: Array<[string, unknown]>,
    colorized: boolean,
): string {
    const methodRaw = takeEntryValue(entries, "method");
    const pathRaw = takeEntryValue(entries, "path");
    const levelBadge = formatLevel(level, colorized);
    const renderedMessage = paint(message, ANSI.bold, colorized);

    if (methodRaw === null && pathRaw === null) {
        return `${levelBadge} ${renderedMessage}`;
    }

    const method = (methodRaw === null ? "-" : String(methodRaw)).toUpperCase();
    const path = pathRaw === null ? "-" : String(pathRaw);
    const renderedMethod = paint(method, ANSI.bold + ANSI.magenta, colorized);
    const renderedPath = paint(path, ANSI.blue, colorized);

    return `${levelBadge} ${renderedMethod} > ${renderedPath} ${renderedMessage}`;
}

function writeLog(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    const runtimeLogLevel = resolveRuntimeLogLevel();
    if (runtimeLogLevel === "silent") {
        return;
    }
    if (runtimeLogLevel === "error" && level !== "error") {
        return;
    }

    const colorized = supportsColor(level);
    const orderedEntries = toOrderedEntries(fields);
    const core = formatCore(level, message, orderedEntries, colorized);
    const formattedFields = formatFields(orderedEntries, colorized);
    const serialized = formattedFields.length > 0
        ? `${core} ${formattedFields}`
        : core;

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
