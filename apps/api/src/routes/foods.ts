import { Elysia, type AnyElysia } from "elysia";

import { createFoodSubmissionSchema, foodSearchQuerySchema } from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { requireSession } from "../middleware/auth";
import { createFoodSubmission, searchFoods } from "../services/foods";
import { getRequest, type RouteContext } from "./context";

export function createFoodRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-food-routes" });

  routes.get("/api/me/foods/search", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const params = new URL(request.url).searchParams;
    const query = foodSearchQuerySchema.parse({
      query: params.get("query") ?? "",
      locale: params.get("locale") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    return searchFoods(db, session.user.id, query);
  });

  routes.post("/api/me/food-submissions", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const input = createFoodSubmissionSchema.parse(context.body);
    return createFoodSubmission(db, session.user.id, input);
  });

  return routes;
}
