import { cors } from "@elysiajs/cors";
import { Elysia, type AnyElysia } from "elysia";

import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { createLogger, type Logger } from "./logger";
import { createRequestContext, createRequestLogging } from "./middleware/context";
import { createErrorHandler } from "./middleware/error-handler";
import { createAdminRoutes } from "./routes/admin";
import { createHealthRoutes } from "./routes/health";
import { createMeRoutes } from "./routes/me";
import { createMealRoutes } from "./routes/meals";
import { createFoodRoutes } from "./routes/foods";
import { createTargetRoutes } from "./routes/targets";
import { createSavedMealRoutes } from "./routes/saved-meals";
import { createAiRoutes } from "./routes/ai";
import { createAiService, type AiService } from "./services/ai";
import { createInsightsRoutes } from "./routes/insights";
import type { LogLevel } from "./config/env";

export interface CreateAppOptions {
  auth: BocconeAuth;
  db: Database;
  version: string;
  corsOrigins: string[];
  logLevel: LogLevel;
  ai?: AiService;
}

/** Build modular Elysia app. Dependencies are injected for isolated tests. */
export function createApp(options: CreateAppOptions): AnyElysia {
  const ai = options.ai ?? createAiService({ db: options.db });
  const logger: Logger = createLogger({
    level: options.logLevel,
    base: { service: "boccone-api" },
  });
  const allowedOrigins = new Set(options.corsOrigins);

  return (
    new Elysia({ name: "boccone-api" })
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
      // Elysia's AnyElysia context is intentionally broad at this composition boundary.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .all("/api/auth/*", ({ request }) => options.auth.handler(request))
      .use(createHealthRoutes(options.version))
      .use(createMeRoutes(options.auth))
      .use(createMealRoutes(options.auth, options.db))
      .use(createFoodRoutes(options.auth, options.db))
      .use(createTargetRoutes(options.auth, options.db))
      .use(createSavedMealRoutes(options.auth, options.db))
      .use(createAiRoutes(options.auth, ai))
      .use(createInsightsRoutes(options.auth, options.db))
      .use(createAdminRoutes(options.auth, options.db, ai))
  );
}
