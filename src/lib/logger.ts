export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getConfiguredLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  if (envLevel && envLevel in LOG_LEVELS) return envLevel;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const configuredLevel = getConfiguredLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  [key: string]: unknown;
}

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      cause: error.cause,
    };
  }
  return error;
}

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("token") || key.toLowerCase().includes("password")) {
      sanitized[key] = "[REDACTED]";
    } else if (value instanceof Error) {
      sanitized[key] = serializeError(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function createLogEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizeMeta(meta || {}),
  };
  return entry;
}

function output(level: LogLevel, entry: LogEntry): void {
  if (process.env.NODE_ENV === "production") {
    const json = JSON.stringify(entry);
    switch (level) {
      case "error":
        console.error(json); // eslint-disable-line no-console
        break;
      case "warn":
        console.warn(json); // eslint-disable-line no-console
        break;
      default:
        console.log(json); // eslint-disable-line no-console
    }
  } else {
    const prefix = `[${entry.timestamp.split("T")[1]?.split(".")[0] || entry.timestamp}] [${level.toUpperCase()}]`;
    const { level: _, timestamp: __, message: ___, ...rest } = entry;
    const restStr = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
    const logMsg = `${prefix} ${entry.message}${restStr}`;
    switch (level) {
      case "error":
        console.error(logMsg); // eslint-disable-line no-console
        break;
      case "warn":
        console.warn(logMsg); // eslint-disable-line no-console
        break;
      default:
        console.log(logMsg); // eslint-disable-line no-console
    }
  }
}

export interface Logger {
  debug(_message: string, _meta?: Record<string, unknown>): void;
  info(_message: string, _meta?: Record<string, unknown>): void;
  warn(_message: string, _meta?: Record<string, unknown>): void;
  error(_message: string, _meta?: Record<string, unknown>): void;
  child(_defaultMeta: Record<string, unknown>): Logger;
}

function createLogger(defaultMeta?: Record<string, unknown>): Logger {
  const base = defaultMeta || {};

  const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog(level)) return;
    output(level, createLogEntry(level, message, { ...base, ...meta }));
  };

  return {
    debug: (message, meta) => log("debug", message, meta),
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta),
    child: (meta) => createLogger({ ...base, ...meta }),
  };
}

export const logger: Logger = createLogger();
