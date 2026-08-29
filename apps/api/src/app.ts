import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import type { BocconeAuth } from "@boccone/auth";

import { createLogger, type Logger } from "./logger";
import { createRequestContext, createRequestLogging } from "./middleware/context";
import { createErrorHandler } from "./middleware/error-handler";
import { createAdminRoutes } from "./routes/admin";
import { createHealthRoutes } from "./routes/health";
import { createMeRoutes } from "./routes/me";
import type { LogLevel } from "./config/env";

export interface CreateAppOptions {
  auth: BocconeAuth;
  version: string;
  corsOrigins: string[];
  logLevel: LogLevel;
}

/** Build modular Elysia app. Dependencies are injected for isolated tests. */
export function createApp(options: CreateAppOptions) {
  const logger: Logger = createLogger({
    level: options.logLevel,
    base: { service: "boccone-api" },
  });
  const allowedOrigins = new Set(options.corsOrigins);

  return new Elysia({ name: "boccone-api" })
    .use(createRequestContext())
    .use(createRequestLogging(logger))
    .onError(createErrorHandler(logger))
    .use(
      cors({
        origin: (request) => {
          const origin = request.headers.get("origin");
          return origin !== null && allowedOrigins.has(origin);
        },
        credentials: true,
        allowedHeaders: ["content-type", "authorization"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        maxAge: 86_400,
      }),
    )
    .all("/api/auth/*", ({ request }) => options.auth.handler(request))
    .use(createHealthRoutes(options.version))
    .use(createMeRoutes(options.auth))
    .use(createAdminRoutes(options.auth));
}
