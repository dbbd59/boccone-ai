import { Elysia, type AnyElysia } from "elysia";

import { adminAnalyticsQuerySchema } from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { requireSession } from "../../middleware/auth";
import {
  getAdminAiAnalytics,
  getAdminCatalog,
  getAdminNutrition,
  getAdminOverview,
} from "../../services/analytics";
import { getRequest, type RouteContext } from "../context";

export function createAdminAnalyticsRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-analytics-routes" });

  routes.get("/api/admin/analytics/overview", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    return getAdminOverview(db, parseQuery(request));
  });

  routes.get("/api/admin/analytics/nutrition", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    return getAdminNutrition(db, parseQuery(request));
  });

  routes.get("/api/admin/analytics/foods", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    return getAdminCatalog(db, parseQuery(request));
  });

  routes.get("/api/admin/analytics/ai", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    return getAdminAiAnalytics(db, parseQuery(request));
  });

  return routes;
}

function parseQuery(request: Request) {
  const params = new URL(request.url).searchParams;
  return adminAnalyticsQuerySchema.parse({
    range: params.get("range") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });
}
