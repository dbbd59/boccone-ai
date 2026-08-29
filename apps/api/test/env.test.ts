import { describe, expect, test } from "bun:test";

import { loadConfig } from "../src/config/env";

const BASE_ENV = {
  DATABASE_URL: "postgres://boccone:boccone@localhost:5433/boccone",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

function envWith(extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return { ...BASE_ENV, ...extra };
}

describe("loadConfig", () => {
  test("applies defaults for optional values", () => {
    const config = loadConfig(envWith());
    expect(config.nodeEnv).toBe("development");
    expect(config.isProduction).toBe(false);
    expect(config.apiPort).toBe(3000);
    expect(config.logLevel).toBe("info");
    expect(config.corsOrigins).toEqual([]);
    expect(config.google).toBeUndefined();
    expect(config.apple).toBeUndefined();
  });

  test("rejects missing DATABASE_URL with an actionable message", () => {
    const env = envWith();
    delete env["DATABASE_URL"];
    expect(() => loadConfig(env)).toThrow(/DATABASE_URL/);
  });

  test("rejects short BETTER_AUTH_SECRET", () => {
    expect(() => loadConfig(envWith({ BETTER_AUTH_SECRET: "short" }))).toThrow(/at least 32/);
  });

  test("rejects invalid BETTER_AUTH_URL", () => {
    expect(() => loadConfig(envWith({ BETTER_AUTH_URL: "not-a-url" }))).toThrow(/BETTER_AUTH_URL/);
  });

  test("rejects API_PORT outside the valid port range", () => {
    expect(() => loadConfig(envWith({ API_PORT: "99999" }))).toThrow();
    expect(() => loadConfig(envWith({ API_PORT: "abc" }))).toThrow();
  });

  test("rejects partially configured Google OAuth", () => {
    expect(() => loadConfig(envWith({ GOOGLE_CLIENT_ID: "id-only" }))).toThrow(
      /GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET/,
    );
  });

  test("accepts fully configured Google OAuth", () => {
    const config = loadConfig(envWith({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" }));
    expect(config.google).toEqual({ clientId: "id", clientSecret: "secret" });
  });

  test("rejects partially configured Apple OAuth and names the missing fields", () => {
    expect(() => loadConfig(envWith({ APPLE_SERVICES_ID: "services-id" }))).toThrow(
      /APPLE_BUNDLE_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY/,
    );
  });

  test("unescapes the Apple private key newlines", () => {
    const config = loadConfig(
      envWith({
        APPLE_SERVICES_ID: "services-id",
        APPLE_BUNDLE_ID: "app.boccone.mobile",
        APPLE_TEAM_ID: "TEAM",
        APPLE_KEY_ID: "KEY",
        APPLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----",
      }),
    );
    expect(config.apple?.privateKey).toBe(
      "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
    );
  });

  test("parses CORS origins from a comma-separated list", () => {
    const config = loadConfig(
      envWith({ CORS_ALLOWED_ORIGINS: " http://a.test , http://b.test ,, " }),
    );
    expect(config.corsOrigins).toEqual(["http://a.test", "http://b.test"]);
  });

  test("marks production", () => {
    const config = loadConfig(envWith({ NODE_ENV: "production" }));
    expect(config.isProduction).toBe(true);
  });
});
