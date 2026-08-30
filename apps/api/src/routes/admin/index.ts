import { Elysia, type AnyElysia } from "elysia";

import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { createAdminAuditLogRoutes } from "./audit-logs";
import { createAdminMealRoutes } from "./meals";
import { createAdminFoodRoutes } from "./foods";
import { createAdminUserRoutes } from "./users";
import { createAdminAiUsageRoutes } from "./ai-usage";
import { createAdminAnalyticsRoutes } from "./analytics";
import type { AiService } from "../../services/ai";

export function createAdminRoutes(auth: BocconeAuth, db: Database, ai: AiService): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-routes" });
  routes.use(createAdminUserRoutes(auth, db));
  routes.use(createAdminMealRoutes(auth, db));
  routes.use(createAdminFoodRoutes(auth, db));
  routes.use(createAdminAuditLogRoutes(auth, db));
  routes.use(createAdminAiUsageRoutes(auth, ai));
  routes.use(createAdminAnalyticsRoutes(auth, db));
  return routes;
}
