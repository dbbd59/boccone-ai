import { Elysia, type AnyElysia } from "elysia";

import { adminUserParamsSchema, adminUserRoleSchema } from "@boccone/contracts";
import type { Database } from "@boccone/db";

import { recordAdminAuditLog } from "../../services/admin-audit";
import { setAdminUserRole } from "../../services/admin-user-mutations";
import {
  assertNotSelf,
  type AdminUserMutationContext,
  requireActorUserId,
} from "./user-mutation-support";
import { getRequest, type RouteContext } from "../context";

export function createAdminUserRoleRoutes(
  context: AdminUserMutationContext,
  db: Database,
): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-user-role-route" });
  routes.post("/api/admin/users/:id/role", async (routeContext: RouteContext) => {
    const request = getRequest(routeContext);
    const params = routeContext.params;
    const actorUserId = await requireActorUserId(context.auth, request);
    const { id } = adminUserParamsSchema.parse(params);
    assertNotSelf(actorUserId, id, "You cannot change your own admin role");
    const data = adminUserRoleSchema.parse(routeContext.body);
    const updatedUser = await setAdminUserRole({
      handler: context.handler,
      headers: request.headers,
      userId: id,
      data,
    });
    await recordAdminAuditLog(db, {
      actorUserId,
      targetUserId: id,
      action: "user_role_changed",
      metadata: { role: data.role },
    });
    return { user: updatedUser };
  });
  return routes;
}
