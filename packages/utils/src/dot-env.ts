import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * Parse the contents of a .env file into key/value pairs.
 * Supports `#` comments, blank lines and optional surrounding quotes.
 */
export function parseEnvFile(contents: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key.length > 0) result[key] = value;
  }
  return result;
}

/**
 * Walk up from `startDir` looking for a `.env` file and load it into
 * `process.env` without overriding variables that are already set.
 * Idempotent and side-effect free when no `.env` exists.
 */
export function loadDotEnvUpwards(startDir: string = process.cwd()): void {
  let dir = resolve(startDir);
  // Bounded walk: repo is shallow; 12 levels is plenty and guarantees termination.
  for (let i = 0; i < 12; i++) {
    const candidate = join(dir, ".env");
    try {
      const parsed = parseEnvFile(readFileSync(candidate, "utf8"));
      for (const [key, value] of Object.entries(parsed)) {
        if (!(key in process.env)) process.env[key] = value;
      }
      return;
    } catch {
      dir = dirname(dir);
      if (dir === dirname(dir)) return; // Reached filesystem root.
    }
  }
}
