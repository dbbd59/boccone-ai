import { join } from "node:path";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import type { Database } from "./client";

const MIGRATIONS_FOLDER = join(import.meta.dirname, "..", "drizzle");

/**
 * Apply pending Drizzle migrations programmatically.
 * Used by tests and bootstrap tooling; the canonical CLI entry is
 * `bun run db:migrate` (drizzle-kit) in this package.
 */
export async function migrateDatabase(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}
