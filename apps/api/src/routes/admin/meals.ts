import { Elysia, type AnyElysia } from "elysia";

import {
  adminMealParamsSchema,
  adminMealIdParamsSchema,
  adminGlobalMealsQuerySchema,
  adminMealsQuerySchema,
  adminUserParamsSchema,
  createMealSchema,
  updateMealSchema,
} from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { requireSession } from "../../middleware/auth";
import { recordAdminAuditLog } from "../../services/admin-audit";
import {
  createAdminMeal,
  getAdminGlobalMeal,
  getAdminMeal,
  listAdminMealsGlobal,
  listAdminMeals,
  removeAdminMeal,
  updateAdminMeal,
} from "../../services/meals";
import { getRequest, type RouteContext } from "../context";

export function createAdminMealRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-meal-routes" });

  routes.get("/api/admin/meals", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const searchParams = new URL(request.url).searchParams;
    const query = adminGlobalMealsQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });
    return listAdminMealsGlobal(db, query);
  });

  routes.get("/api/admin/meals/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const { id } = adminMealIdParamsSchema.parse(context.params);
    return { meal: await getAdminGlobalMeal(db, id) };
  });

  routes.get("/api/admin/users/:id/meals", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const { id } = adminUserParamsSchema.parse(context.params);
    const searchParams = new URL(request.url).searchParams;
    const query = adminMealsQuerySchema.parse({
      date: searchParams.get("date") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });
    return listAdminMeals(db, id, query);
  });

  routes.post("/api/admin/users/:id/meals", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request, "admin");
    const { id } = adminUserParamsSchema.parse(context.params);
    const input = createMealSchema.parse(context.body);
    const meal = await createAdminMeal(db, id, input);
    await recordAdminAuditLog(db, {
      actorUserId: session.user.id,
      targetUserId: id,
      action: "user_meal_created",
      metadata: mealAuditMetadata(meal.id, input),
    });
    return { meal };
  });

  routes.get("/api/admin/users/:id/meals/:mealId", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const { id, mealId } = adminMealParamsSchema.parse(context.params);
    return { meal: await getAdminMeal(db, id, mealId) };
  });

  routes.patch("/api/admin/users/:id/meals/:mealId", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request, "admin");
    const { id, mealId } = adminMealParamsSchema.parse(context.params);
    const input = updateMealSchema.parse(context.body);
    const meal = await updateAdminMeal(db, id, mealId, input);
    await recordAdminAuditLog(db, {
      actorUserId: session.user.id,
      targetUserId: id,
      action: "user_meal_updated",
      metadata: { mealId, fields: Object.keys(input).sort().join(",") },
    });
    return { meal };
  });

  routes.delete("/api/admin/users/:id/meals/:mealId", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request, "admin");
    const { id, mealId } = adminMealParamsSchema.parse(context.params);
    const result = await removeAdminMeal(db, id, mealId);
    await recordAdminAuditLog(db, {
      actorUserId: session.user.id,
      targetUserId: id,
      action: "user_meal_removed",
      metadata: { mealId },
    });
    return result;
  });

  return routes;
}

function mealAuditMetadata(
  mealId: string,
  input: { category: string; date: string },
): Record<string, string> {
  return { mealId, category: input.category, date: input.date };
}
