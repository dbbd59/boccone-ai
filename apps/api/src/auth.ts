import { createAuth } from "@boccone/auth";
import { createDb } from "@boccone/db";

import { loadConfig } from "./config/env";
import { createResetPasswordEmailSender } from "./email";
import { createLogger } from "./logger";

// Instantiated at module load for the running server (and CLI tooling).
// Tests build their own instances via createApp/createAuth directly.
const config = loadConfig();

export const db = createDb({ connectionString: config.databaseUrl });

const logger = createLogger({ level: config.logLevel, base: { service: "boccone-api" } });

export const auth = createAuth({
  db,
  secret: config.authSecret,
  baseURL: config.authBaseUrl,
  trustedOrigins: config.corsOrigins,
  isProduction: config.isProduction,
  google: config.google,
  apple: config.apple,
  sendResetPasswordEmail: createResetPasswordEmailSender({ isProduction: config.isProduction, logger }),
});

export type Session = typeof auth.$Infer.Session;
