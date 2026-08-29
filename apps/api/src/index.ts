import packageJson from "../package.json";
import { closeDb } from "@boccone/db";

import { auth, db } from "./auth";
import { createApp } from "./app";
import { loadConfig } from "./config/env";
import { createLogger } from "./logger";

const config = loadConfig();
const logger = createLogger({ level: config.logLevel, base: { service: "boccone-api" } });

const app = createApp({
  auth,
  version: packageJson.version,
  corsOrigins: config.corsOrigins,
  logLevel: config.logLevel,
});

const server = Bun.serve({
  port: config.apiPort,
  fetch: app.fetch,
  // Pretty error pages in development only.
  development: !config.isProduction,
});

if (!config.isProduction) {
  logger.info(
    "Password-reset emails print to this console in development — see apps/api/src/email.ts",
    {
      env: config.nodeEnv,
    },
  );
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    logger.info(`Received ${signal}, shutting down`, {});
    void server.stop(true);
    void closeDb(db).finally(() => process.exit(0));
  });
}
