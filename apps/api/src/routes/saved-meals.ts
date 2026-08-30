import { Elysia, type AnyElysia } from "elysia";

import {
  createSavedMealSchema,
  savedMealIdParamsSchema,
  savedMealResponseSchema,
  savedMealRoutineInputSchema,
  updateSavedMealSchema,
  useSavedMealSchema,
} from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { requireSession } from "../middleware/auth";
import {
  createSavedMeal,
  deleteSavedMealRoutine,
  getSavedMeal,
  listSavedMeals,
  markSavedMealUsed,
  putSavedMealRoutine,
  removeSavedMeal,
  updateSavedMeal,
} from "../services/saved-meals";
import { getRequest, type RouteContext } from "./context";

/** Saved Meals + Routines: private user templates, ownership enforced here. */
export function createSavedMealRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-saved-meal-routes" });

  routes.get("/api/me/saved-meals", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    return listSavedMeals(db, session.user.id);
  });

  routes.post("/api/me/saved-meals", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const input = createSavedMealSchema.parse(context.body);
    return createSavedMeal(db, session.user.id, input);
  });

  routes.get("/api/me/saved-meals/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const { id } = savedMealIdParamsSchema.parse(context.params);
    return savedMealResponseSchema.parse({
      savedMeal: await getSavedMeal(db, session.user.id, id),
    });
  });

  routes.patch("/api/me/saved-meals/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const { id } = savedMealIdParamsSchema.parse(context.params);
    const input = updateSavedMealSchema.parse(context.body);
    return updateSavedMeal(db, session.user.id, id, input);
  });

  routes.delete("/api/me/saved-meals/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const { id } = savedMealIdParamsSchema.parse(context.params);
    return removeSavedMeal(db, session.user.id, id);
  });

  routes.put("/api/me/saved-meals/:id/routine", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const { id } = savedMealIdParamsSchema.parse(context.params);
    const input = savedMealRoutineInputSchema.parse(context.body);
    return putSavedMealRoutine(db, session.user.id, id, input);
  });

  routes.delete("/api/me/saved-meals/:id/routine", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const { id } = savedMealIdParamsSchema.parse(context.params);
    return deleteSavedMealRoutine(db, session.user.id, id);
  });

  routes.post("/api/me/saved-meals/:id/use", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const { id } = savedMealIdParamsSchema.parse(context.params);
    const input = useSavedMealSchema.parse(context.body);
    return markSavedMealUsed(db, session.user.id, id, input);
  });

  return routes;
}
