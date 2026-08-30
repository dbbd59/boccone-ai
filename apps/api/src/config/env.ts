import { z } from "zod";

import type { AppleOAuthConfig, GoogleOAuthConfig } from "@boccone/auth";
import { loadDotEnvUpwards } from "@boccone/utils";

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export type LogLevel = z.infer<typeof logLevelSchema>;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(
      32,
      "BETTER_AUTH_SECRET must be at least 32 characters (generate one with: openssl rand -base64 32)",
    ),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL must be a valid URL, e.g. http://localhost:3000"),
  // Railway injects PORT at runtime. API_PORT remains the local/dev override.
  PORT: z.coerce.number().int().min(1).max(65535).optional(),
  API_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  LOG_LEVEL: logLevelSchema.default("info"),
  /** Comma-separated browser origins allowed to call the API with credentials. */
  CORS_ALLOWED_ORIGINS: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_SERVICES_ID: z.string().optional(),
  APPLE_BUNDLE_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
});

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  isProduction: boolean;
  databaseUrl: string;
  authSecret: string;
  authBaseUrl: string;
  apiPort: number;
  logLevel: LogLevel;
  corsOrigins: string[];
  google?: GoogleOAuthConfig;
  apple?: AppleOAuthConfig;
}

const APPLE_FIELDS = [
  "APPLE_SERVICES_ID",
  "APPLE_BUNDLE_ID",
  "APPLE_TEAM_ID",
  "APPLE_KEY_ID",
  "APPLE_PRIVATE_KEY",
] as const;

function buildOAuthConfig(env: z.infer<typeof envSchema>): Pick<AppConfig, "google" | "apple"> {
  const googleConfigured =
    (env.GOOGLE_CLIENT_ID?.length ?? 0) > 0 && (env.GOOGLE_CLIENT_SECRET?.length ?? 0) > 0;
  const googlePartiallyConfigured =
    !googleConfigured &&
    ((env.GOOGLE_CLIENT_ID?.length ?? 0) > 0 || (env.GOOGLE_CLIENT_SECRET?.length ?? 0) > 0);

  if (googlePartiallyConfigured) {
    throw new Error(
      "Google OAuth is partially configured: set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (or neither).",
    );
  }

  const appleValues = APPLE_FIELDS.map((field) => env[field]);
  const appleConfiguredCount = appleValues.filter((value) => (value?.length ?? 0) > 0).length;
  if (appleConfiguredCount > 0 && appleConfiguredCount < APPLE_FIELDS.length) {
    const missing = APPLE_FIELDS.filter((_, index) => (appleValues[index]?.length ?? 0) === 0);
    throw new Error(`Apple OAuth is partially configured. Missing: ${missing.join(", ")}.`);
  }

  return {
    ...(googleConfigured
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
          },
        }
      : {}),
    ...(appleConfiguredCount === APPLE_FIELDS.length
      ? {
          apple: {
            clientId: env.APPLE_SERVICES_ID ?? "",
            bundleId: env.APPLE_BUNDLE_ID ?? "",
            teamId: env.APPLE_TEAM_ID ?? "",
            keyId: env.APPLE_KEY_ID ?? "",
            // .p8 keys are multi-line PEM; unescape the single-line env form.
            privateKey: (env.APPLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
          },
        }
      : {}),
  };
}

/**
 * Parse and validate the environment. Throws with an aggregated, actionable
 * message on the first run when configuration is missing or malformed.
 */
export function loadConfig(source?: NodeJS.ProcessEnv): AppConfig {
  // Load the nearest .env (walking up from cwd) without overriding real env
  // vars — keeps local dev self-sufficient while Railway/etc. inject prod vars.
  // An explicit `source` (tests) always wins over the file contents.
  loadDotEnvUpwards();
  const parsed = envSchema.safeParse(source ?? process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  const env = parsed.data;

  const corsOrigins = env.CORS_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return {
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === "production",
    databaseUrl: env.DATABASE_URL,
    authSecret: env.BETTER_AUTH_SECRET,
    authBaseUrl: env.BETTER_AUTH_URL,
    apiPort: env.API_PORT ?? env.PORT ?? 3000,
    logLevel: env.LOG_LEVEL,
    corsOrigins,
    ...buildOAuthConfig(env),
  };
}
