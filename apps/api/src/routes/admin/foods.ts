import { Elysia, type AnyElysia } from "elysia";

import {
  adminFoodIdParamsSchema,
  adminFoodMergeSchema,
  adminFoodRejectSchema,
  adminFoodSubmissionIdParamsSchema,
  adminFoodSubmissionsQuerySchema,
  adminFoodUpdateSchema,
  adminFoodsQuerySchema,
} from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { requireSession } from "../../middleware/auth";
import { recordAdminAuditLog } from "../../services/admin-audit";
import {
  approveFoodSubmission,
  getAdminFood,
  getAdminFoodSubmission,
  listAdminFoodSubmissions,
  listAdminFoods,
  mergeFoodSubmission,
  rejectFoodSubmission,
  updateAdminFood,
} from "../../services/foods";
import { getRequest, type RouteContext } from "../context";

export function createAdminFoodRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-food-routes" });

  routes.get("/api/admin/foods", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const params = new URL(request.url).searchParams;
    return listAdminFoods(
      db,
      adminFoodsQuerySchema.parse({
        search: params.get("search") ?? undefined,
        status: params.get("status") ?? undefined,
        sourceType: params.get("sourceType") ?? undefined,
        limit: params.get("limit") ?? undefined,
        offset: params.get("offset") ?? undefined,
      }),
    );
  });

  routes.get("/api/admin/foods/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const { id } = adminFoodIdParamsSchema.parse(context.params);
    return { food: await getAdminFood(db, id) };
  });

  routes.patch("/api/admin/foods/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request, "admin");
    const { id } = adminFoodIdParamsSchema.parse(context.params);
    const input = adminFoodUpdateSchema.parse(context.body);
    const food = await updateAdminFood(db, id, input);
    await recordAdminAuditLog(db, {
      actorUserId: session.user.id,
      action: "food_updated",
      metadata: { foodId: id },
    });
    return { food };
  });

  routes.get("/api/admin/food-submissions", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const params = new URL(request.url).searchParams;
    return listAdminFoodSubmissions(
      db,
      adminFoodSubmissionsQuerySchema.parse({
        status: params.get("status") ?? undefined,
        limit: params.get("limit") ?? undefined,
        offset: params.get("offset") ?? undefined,
      }),
    );
  });

  routes.get("/api/admin/food-submissions/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const { id } = adminFoodSubmissionIdParamsSchema.parse(context.params);
    return { submission: await getAdminFoodSubmission(db, id) };
  });

  routes.post("/api/admin/food-submissions/:id/approve", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request, "admin");
    const { id } = adminFoodSubmissionIdParamsSchema.parse(context.params);
    const result = await approveFoodSubmission(db, session.user.id, id);
    await recordAdminAuditLog(db, {
      actorUserId: session.user.id,
      action: "food_submission_approved",
      metadata: { submissionId: id, foodId: result.food.id },
    });
    return { submission: result };
  });

  routes.post("/api/admin/food-submissions/:id/reject", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request, "admin");
    const { id } = adminFoodSubmissionIdParamsSchema.parse(context.params);
    const input = adminFoodRejectSchema.parse(context.body ?? {});
    const result = await rejectFoodSubmission(db, session.user.id, id, input.reason);
    await recordAdminAuditLog(db, {
      actorUserId: session.user.id,
      action: "food_submission_rejected",
      metadata: { submissionId: id, foodId: result.food.id },
    });
    return { submission: result };
  });

  routes.post("/api/admin/food-submissions/:id/merge", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request, "admin");
    const { id } = adminFoodSubmissionIdParamsSchema.parse(context.params);
    const input = adminFoodMergeSchema.parse(context.body);
    const result = await mergeFoodSubmission(db, session.user.id, id, input.foodId);
    await recordAdminAuditLog(db, {
      actorUserId: session.user.id,
      action: "food_submission_merged",
      metadata: { submissionId: id, foodId: result.food.id, mergedIntoFoodId: input.foodId },
    });
    return { submission: result };
  });

  return routes;
}
