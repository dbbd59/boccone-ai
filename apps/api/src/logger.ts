import type { LogLevel } from "./config/env";

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Keys whose values must never reach a log line. */
const SECRET_KEY_PATTERN =
  /(password|passwd|secret|token|authorization|auth|cookie|api[-_]?key|private[-_]?key|credential)/i;

const MAX_DEPTH = 6;

/** Recursively replace secret-looking values with a marker. */
export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1));
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = SECRET_KEY_PATTERN.test(key) ? "[REDACTED]" : redactValue(item, depth + 1);
    }
    return result;
  }
  return value;
}

export type Logger = {
  debug: (message: string, fields?: Record<string, unknown>) => void;
  info: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  error: (message: string, fields?: Record<string, unknown>) => void;
  child: (fields: Record<string, unknown>) => Logger;
};

export type CreateLoggerOptions = {
  level: LogLevel;
  /** Fields merged into every line (e.g. service name). */
  base?: Record<string, unknown>;
  /** Test seam. */
  write?: (line: string) => void;
};

export function createLogger(options: CreateLoggerOptions): Logger {
  const write = options.write ?? ((line: string) => console.log(line));
  const emit = (
    level: LogLevel,
    message: string,
    fields: Record<string, unknown>,
    base: Record<string, unknown>,
  ): void => {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[options.level]) return;
    const redacted = redactValue({ ...base, ...fields });
    const safeFields: Record<string, unknown> =
      typeof redacted === "object" && redacted !== null ? redacted as Record<string, unknown> : {};
    const line = {
      time: new Date().toISOString(),
      level,
      msg: message,
      ...safeFields,
    };
    write(JSON.stringify(line));
  };

  const base = options.base ?? {};
  const create = (fields: Record<string, unknown>): Logger => ({
    debug: (message, extra) => emit("debug", message, extra ?? {}, fields),
    info: (message, extra) => emit("info", message, extra ?? {}, fields),
    warn: (message, extra) => emit("warn", message, extra ?? {}, fields),
    error: (message, extra) => emit("error", message, extra ?? {}, fields),
    child: (childFields) => create({ ...fields, ...childFields }),
  });

  return create(base);
}
