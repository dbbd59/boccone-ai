import { Elysia, type AnyElysia } from "elysia";

import { adminUserBanSchema, adminUserParamsSchema } from "@boccone/contracts";
import type { Database } from "@boccone/db";

import { recordAdminAuditLog } from "../../services/admin-audit";
import { banAdminUser, unbanAdminUser } from "../../services/admin-user-mutations";
import {
  assertNotSelf,
  type AdminUserMutationContext,
  requireActorUserId,
} from "./user-mutation-support";
import { getRequest, type RouteContext } from "../context";

export function createAdminUserBanRoutes(
  context: AdminUserMutationContext,
  db: Database,
): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-user-ban-route" });
  routes.post("/api/admin/users/:id/ban", async (routeContext: RouteContext) => {
    const request = getRequest(routeContext);
    const params = routeContext.params;
    const actorUserId = await requireActorUserId(context.auth, request);
    const { id } = adminUserParamsSchema.parse(params);
    assertNotSelf(actorUserId, id, "You cannot ban yourself");
    const data = adminUserBanSchema.parse(routeContext.body);
    const updatedUser = await banAdminUser({
      handler: context.handler,
      headers: request.headers,
      userId: id,
      data,
    });
    await recordAdminAuditLog(db, {
      actorUserId,
      targetUserId: id,
      action: "user_banned",
      metadata: {
        reasonProvided: Boolean(data.reason),
        ...(data.durationSeconds !== undefined
          ? { durationSeconds: data.durationSeconds }
          : { duration: "permanent" }),
      },
    });
    return { user: updatedUser };
  });
  routes.post("/api/admin/users/:id/unban", async (routeContext: RouteContext) => {
    const request = getRequest(routeContext);
    const params = routeContext.params;
    const actorUserId = await requireActorUserId(context.auth, request);
    const { id } = adminUserParamsSchema.parse(params);
    const updatedUser = await unbanAdminUser({
      handler: context.handler,
      headers: request.headers,
      userId: id,
    });
    await recordAdminAuditLog(db, {
      actorUserId,
      targetUserId: id,
      action: "user_unbanned",
    });
    return { user: updatedUser };
  });
  return routes;
}
