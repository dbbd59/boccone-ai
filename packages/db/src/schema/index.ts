/**
 * Database schema barrel.
 *
 * Conventions:
 * - `auth.ts` is generated from the Better Auth config (see AGENTS.md) and
 *   should be regenerated with `bunx auth@latest generate` after auth changes.
 * - Product tables (meals, targets, ...) live in dedicated files under
 *   `src/schema/` and are added here as verticals land.
 */
export * from "./auth";
export * from "./admin";
export * from "./targets";
export * from "./meals";
export * from "./foods";
export * from "./saved-meals";
export * from "./ai";
