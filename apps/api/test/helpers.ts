import postgres from "postgres";

import { createAuth } from "@boccone/auth";
import { closeDb, createDb, migrateDatabase, type Database } from "@boccone/db";

import { createApp } from "../src/app";

const LOCAL_POSTGRES_URL =
  process.env["DATABASE_URL"] ?? "postgres://boccone:boccone@localhost:5433/boccone";

export interface TestHarness {
  app: ReturnType<typeof createApp>;
  db: Database;
  resetEmails: { to: string; resetUrl: string }[];
  cleanup: () => Promise<void>;
}

/**
 * Create a throwaway Postgres database for this test run, apply migrations,
 * and build a fully wired app (auth + routes) against it.
 */
export async function createTestHarness(): Promise<TestHarness> {
  const adminSql = postgres(LOCAL_POSTGRES_URL, { max: 1, onnotice: () => undefined });
  try {
    await adminSql`SELECT 1`;
  } catch (error) {
    await adminSql.end({ timeout: 1 });
    throw new Error(
      `Cannot reach Postgres at ${LOCAL_POSTGRES_URL}. Start it with: bun run db:up\n(${(error as Error).message})`,
    );
  }

  const dbName = `boccone_test_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  await adminSql.unsafe(`CREATE DATABASE "${dbName}"`);
  await adminSql.end({ timeout: 1 });

  const dbUrl = LOCAL_POSTGRES_URL.replace(/\/[^/?]+(\?.*)?$/, `/${dbName}`);
  const db = createDb({ connectionString: dbUrl, max: 5 });
  await migrateDatabase(db);

  const resetEmails: { to: string; resetUrl: string }[] = [];
  const auth = createAuth({
    db,
    secret: "test-secret-boccone-0123456789-0123456789-abcdef",
    baseURL: "http://localhost:3000",
    trustedOrigins: ["http://localhost:3001"],
    isProduction: false,
    rateLimitEnabled: false,
    sendResetPasswordEmail: (input) => {
      resetEmails.push({ to: input.to, resetUrl: input.resetUrl });
    },
  });

  const app = createApp({
    auth,
    version: "test",
    corsOrigins: ["http://localhost:3001"],
    logLevel: "error",
  });

  const cleanup = async (): Promise<void> => {
    await closeDb(db);
    const dropSql = postgres(LOCAL_POSTGRES_URL, { max: 1, onnotice: () => undefined });
    await dropSql.unsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    await dropSql.end({ timeout: 1 });
  };

  return { app, db, resetEmails, cleanup };
}

/** Minimal cookie jar so auth round-trips work with app.fetch(). */
export function createCookieJar() {
  const jar = new Map<string, string>();
  return {
    capture(response: Response): void {
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";")[0];
        if (!pair) continue;
        const eq = pair.indexOf("=");
        if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    },
    header(): string {
      return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
    },
  };
}

export function uniqueEmail(prefix = "user"): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}@boccone.test`;
}
