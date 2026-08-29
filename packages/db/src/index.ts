export { closeDb, createDb, type Database } from "./client";
export * from "./schema";
export { migrateDatabase } from "./migrate";

// Re-export the query operators apps need so they never depend on
// drizzle-orm directly — the database stays behind this package's boundary.
export { eq, and, or, not, desc, asc, count, inArray, sql } from "drizzle-orm";
