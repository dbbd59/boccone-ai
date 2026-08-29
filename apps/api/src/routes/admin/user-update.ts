import { Elysia, type AnyElysia } from "elysia";

import { adminUserParamsSchema, adminUserUpdateSchema } from "@boccone/contracts";
import type { Database } from "@boccone/db";

import { recordAdminAuditLog } from "../../services/admin-audit";
import { updateAdminUser } from "../../services/admin-user-mutations";
import { type AdminUserMutationContext, requireActorUserId } from "./user-mutation-support";
import { getRequest, type RouteContext } from "../context";

export function createAdminUserUpdateRoutes(
  context: AdminUserMutationContext,
  db: Database,
): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-user-update-route" });
  routes.patch("/api/admin/users/:id", async (routeContext: RouteContext) => {
    const request = getRequest(routeContext);
    const params = routeContext.params;
    const actorUserId = await requireActorUserId(context.auth, request);
    const { id } = adminUserParamsSchema.parse(params);
    const data = adminUserUpdateSchema.parse(routeContext.body);
    const updatedUser = await updateAdminUser({
      handler: context.handler,
      headers: request.headers,
      userId: id,
      data,
    });
    await recordAdminAuditLog(db, {
      actorUserId,
      targetUserId: id,
      action: "user_updated",
      metadata: { fields: Object.keys(data).sort().join(",") },
    });
    return { user: updatedUser };
  });
  return routes;
}
