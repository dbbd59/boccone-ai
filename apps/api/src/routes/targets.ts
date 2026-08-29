import { Elysia, type AnyElysia } from "elysia";

import {
  adminUserParamsSchema,
  dailyTargetsResponseSchema,
  updateDailyTargetsSchema,
} from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { requireSession } from "../middleware/auth";
import { recordAdminAuditLog } from "../services/admin-audit";
import {
  getAdminUserDailyTargets,
  getDailyTargets,
  removeAdminUserDailyTargets,
  updateAdminUserDailyTargets,
  updateDailyTargets,
} from "../services/daily-targets";
import { getRequest, type RouteContext } from "./context";

/** Authenticated target reads/writes plus the admin read-only inspection path. */
export function createTargetRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-target-routes" });

  routes.get("/api/me/targets", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    return getDailyTargets(db, session.user.id);
  });

  routes.put("/api/me/targets", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const targets = updateDailyTargetsSchema.parse(context.body);
    return updateDailyTargets(db, session.user.id, targets);
  });

  routes.get("/api/admin/users/:id/targets", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const { id } = adminUserParamsSchema.parse(context.params);
    return dailyTargetsResponseSchema.parse(await getAdminUserDailyTargets(db, id));
  });

  routes.put("/api/admin/users/:id/targets", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request, "admin");
    const { id } = adminUserParamsSchema.parse(context.params);
    const targets = updateDailyTargetsSchema.parse(context.body);
    const result = await updateAdminUserDailyTargets(db, id, targets);
    await recordAdminAuditLog(db, {
      actorUserId: session.user.id,
      targetUserId: id,
      action: "user_targets_updated",
      metadata: {
        fields: Object.keys(targets).sort().join(","),
        calories: targets.calories ?? "Not set",
        proteinGrams: targets.proteinGrams ?? "Not set",
        carbohydratesGrams: targets.carbohydratesGrams ?? "Not set",
        fatGrams: targets.fatGrams ?? "Not set",
      },
    });
    return result;
  });

  routes.delete("/api/admin/users/:id/targets", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request, "admin");
    const { id } = adminUserParamsSchema.parse(context.params);
    const result = await removeAdminUserDailyTargets(db, id);
    await recordAdminAuditLog(db, {
      actorUserId: session.user.id,
      targetUserId: id,
      action: "user_targets_removed",
    });
    return result;
  });

  return routes;
}
