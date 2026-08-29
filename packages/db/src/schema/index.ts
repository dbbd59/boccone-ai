/**
 * Database schema barrel.
 *
 * Conventions:
 * - `auth.ts` is generated from the Better Auth config (see AGENTS.md) and
 *   should be regenerated with `bunx auth@latest generate` after auth changes.
 * - Product tables (meals, targets, ...) live in dedicated files under
 *   `src/schema/` and are added here in future verticals.
 */
export * from "./auth";
