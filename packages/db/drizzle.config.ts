import { defineConfig } from "drizzle-kit";
import { loadDotEnvUpwards } from "@boccone/utils";

// Load the monorepo root .env (nearest .env walking up from this directory)
// so db tooling can run from any workspace without duplicating env files.
// Real environment variables always win.
loadDotEnvUpwards(import.meta.dirname);

if (!process.env["DATABASE_URL"]) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env at the repository root, or export DATABASE_URL.",
  );
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["DATABASE_URL"],
  },
  strict: true,
  verbose: true,
});
