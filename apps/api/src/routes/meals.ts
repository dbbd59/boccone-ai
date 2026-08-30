import { Elysia, type AnyElysia } from "elysia";

import {
  calendarMonthResponseSchema,
  calendarMonthSchema,
  createMealSchema,
  dailyMealsResponseSchema,
  diaryQuerySchema,
  diaryResponseSchema,
  mealDateSchema,
  mealIdParamsSchema,
  updateMealSchema,
} from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { requireSession } from "../middleware/auth";
import {
  createUserMeal,
  getCalendarMonth,
  getMealDiary,
  getDailyMeals,
  getUserMeal,
  removeUserMeal,
  updateUserMeal,
} from "../services/meals";
import { getRequest, type RouteContext } from "./context";

export function createMealRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-meal-routes" });

  routes.get("/api/me/calendar", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const month = calendarMonthSchema.parse(new URL(request.url).searchParams.get("month"));
    return calendarMonthResponseSchema.parse(await getCalendarMonth(db, session.user.id, month));
  });

  routes.get("/api/me/meals", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const date = mealDateSchema.parse(new URL(request.url).searchParams.get("date"));
    return dailyMealsResponseSchema.parse(await getDailyMeals(db, session.user.id, date));
  });

  routes.get("/api/me/diary", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const query = diaryQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return diaryResponseSchema.parse(
      await getMealDiary(db, session.user.id, query.before, query.limit, query.foodId),
    );
  });

  routes.post("/api/me/meals", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const input = createMealSchema.parse(context.body);
    return { meal: await createUserMeal(db, session.user.id, input) };
  });

  routes.get("/api/me/meals/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const { id } = mealIdParamsSchema.parse(context.params);
    return { meal: await getUserMeal(db, session.user.id, id) };
  });

  routes.patch("/api/me/meals/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const { id } = mealIdParamsSchema.parse(context.params);
    const input = updateMealSchema.parse(context.body);
    return { meal: await updateUserMeal(db, session.user.id, id, input) };
  });

  routes.delete("/api/me/meals/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const { id } = mealIdParamsSchema.parse(context.params);
    return removeUserMeal(db, session.user.id, id);
  });

  return routes;
}
