// src/lib/logger.ts
// ============================================================================
// STRUCTURED JSON LOGGER
// ============================================================================
//
// Lightweight structured logger that outputs JSON in production and pretty
// console output in development. Every log entry includes a requestId for
// tracing, a timestamp, and the log level.
//
// Usage:
//   import { logger } from "@/lib/logger";
//   logger.info("User logged in", { userId: "abc" });
//   logger.warn("Rate limit approaching", { ip, remaining });
//   logger.error("Payment failed", { orderId, error: err.message });
//
// In production, pipe stdout to your log aggregator (Datadog, CloudWatch,
// etc.) for structured search and alerting.
// ============================================================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }

  // Development: pretty-print with emoji indicators
  const emoji: Record<LogLevel, string> = {
    debug: "🔍",
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
  };

  const { level, message, timestamp, requestId, ...data } = entry;
  const prefix = `${emoji[level]} [${level.toUpperCase()}] ${timestamp}`;
  const reqPart = requestId ? ` [${requestId.slice(0, 8)}]` : "";
  const dataPart =
    Object.keys(data).length > 0 ? `\n  ${JSON.stringify(data, null, 2)}` : "";

  return `${prefix}${reqPart} ${message}${dataPart}`;
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log("debug", message, data),
  info: (message: string, data?: Record<string, unknown>) => log("info", message, data),
  warn: (message: string, data?: Record<string, unknown>) => log("warn", message, data),
  error: (message: string, data?: Record<string, unknown>) => log("error", message, data),
};

export type { LogLevel, LogEntry };
