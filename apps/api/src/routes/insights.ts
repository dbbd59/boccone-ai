import { Elysia, type AnyElysia } from "elysia";

import {
  personalInsightsQuerySchema,
  personalInsightsResponseSchema,
  personalNutritionDetailSchema,
  personalNutritionQuerySchema,
} from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { requireSession } from "../middleware/auth";
import { getPersonalInsights, getPersonalNutritionDetail } from "../services/analytics";
import { getRequest, type RouteContext } from "./context";

export function createInsightsRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-insights-routes" });

  routes.get("/api/me/insights", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const params = new URL(request.url).searchParams;
    const query = personalInsightsQuerySchema.parse({
      range: params.get("range") ?? undefined,
      today: params.get("today") ?? undefined,
    });
    return personalInsightsResponseSchema.parse(
      await getPersonalInsights(db, session.user.id, query),
    );
  });

  routes.get("/api/me/insights/nutrition", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const params = new URL(request.url).searchParams;
    const query = personalNutritionQuerySchema.parse({
      range: params.get("range") ?? undefined,
      today: params.get("today") ?? undefined,
      metric: params.get("metric") ?? undefined,
    });
    return personalNutritionDetailSchema.parse(
      await getPersonalNutritionDetail(db, session.user.id, query),
    );
  });

  return routes;
}
