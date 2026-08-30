import { describe, expect, test } from "bun:test";

import { createLogger, redactValue } from "../src/logger";

describe("redactValue", () => {
  test("redacts secret-looking keys at the top level", () => {
    const result = redactValue({
      password: "hunter2",
      Authorization: "Bearer abc",
      cookie: "session=xyz",
      api_key: "sk-123",
      privateKey: "-----BEGIN",
      token: "t",
    }) as Record<string, unknown>;
    for (const key of ["password", "Authorization", "cookie", "api_key", "privateKey", "token"]) {
      expect(result[key]).toBe("[REDACTED]");
    }
  });

  test("redacts nested secrets inside objects and arrays", () => {
    const result = redactValue({
      user: { name: "ok", sessionToken: "leak" },
      items: [{ passwordHash: "leak" }, { safe: "value" }],
    }) as Record<string, unknown>;
    const user = result["user"] as Record<string, unknown>;
    const items = result["items"] as Record<string, unknown>[];
    expect(user["name"]).toBe("ok");
    expect(user["sessionToken"]).toBe("[REDACTED]");
    expect(items[0]?.["passwordHash"]).toBe("[REDACTED]");
    expect(items[1]?.["safe"]).toBe("value");
  });

  test("keeps non-secret values untouched", () => {
    const input = { requestId: "r1", method: "POST", durationMs: 12 };
    expect(redactValue(input)).toEqual(input);
  });

  test("serializes Error values safely", () => {
    const result = redactValue({ error: new Error("provider rejected sk-proj-secret") }) as {
      error: { name: string; message: string };
    };
    expect(result.error.name).toBe("Error");
    expect(result.error.message).not.toContain("sk-proj-secret");
  });
});

describe("createLogger", () => {
  type Line = Record<string, unknown>;
  const capture = () => {
    const lines: Line[] = [];
    const logger = createLogger({
      level: "info",
      base: { service: "boccone-api" },
      write: (line) => lines.push(JSON.parse(line) as Line),
    });
    return { lines, logger };
  };

  test("emits structured JSON lines with time, level, msg and fields", () => {
    const { lines, logger } = capture();
    logger.info("hello", { requestId: "r1", method: "GET" });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.["msg"]).toBe("hello");
    expect(lines[0]?.["level"]).toBe("info");
    expect(lines[0]?.["service"]).toBe("boccone-api");
    expect(lines[0]?.["requestId"]).toBe("r1");
    expect(typeof lines[0]?.["time"]).toBe("string");
  });

  test("respects the configured level", () => {
    const { lines, logger } = capture();
    logger.debug("hidden");
    logger.info("visible");
    expect(lines).toHaveLength(1);
    expect(lines[0]?.["msg"]).toBe("visible");
  });

  test("child loggers merge fields and redact secrets", () => {
    const { lines, logger } = capture();
    const request = logger.child({ requestId: "r2" });
    request.warn("failed", { password: "leak" });
    expect(lines[0]?.["requestId"]).toBe("r2");
    expect(lines[0]?.["password"]).toBe("[REDACTED]");
  });
});
