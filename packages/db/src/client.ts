import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index";

export type Database = PostgresJsDatabase<typeof schema> & {
  /** Underlying postgres-js client, used only for graceful shutdown. */
  $client: postgres.Sql;
};

export type CreateDbOptions = {
  connectionString: string;
  /** Max pooled connections. Tune for the deployment target. */
  max?: number;
  /** Override for tests. */
  client?: postgres.Sql;
};

/**
 * Create a Drizzle database handle backed by a postgres-js pool.
 * The pool connects lazily — creating a handle never opens a socket,
 * which keeps import-time side effects free.
 */
export function createDb(options: CreateDbOptions): Database {
  const client =
    options.client ??
    postgres(options.connectionString, {
      max: options.max ?? 10,
      // Slow network (e.g. Railway private networking cold start) tolerance.
      idle_timeout: 30,
      connect_timeout: 10,
    });
  return drizzle(client, { schema }) as Database;
}

export { schema };

/** Close the underlying postgres-js pool (graceful shutdown / tests). */
export async function closeDb(db: Database): Promise<void> {
  await db.$client.end({ timeout: 5 });
}
