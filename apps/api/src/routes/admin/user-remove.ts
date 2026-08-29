import { Elysia, type AnyElysia } from "elysia";

import { adminUserParamsSchema } from "@boccone/contracts";
import type { Database } from "@boccone/db";

import { recordAdminAuditLog } from "../../services/admin-audit";
import { removeAdminUser } from "../../services/admin-user-mutations";
import {
  assertNotSelf,
  type AdminUserMutationContext,
  requireActorUserId,
} from "./user-mutation-support";
import { getRequest, type RouteContext } from "../context";

export function createAdminUserRemoveRoutes(
  context: AdminUserMutationContext,
  db: Database,
): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-user-remove-route" });
  routes.delete("/api/admin/users/:id", async (routeContext: RouteContext) => {
    const request = getRequest(routeContext);
    const params = routeContext.params;
    const actorUserId = await requireActorUserId(context.auth, request);
    const { id } = adminUserParamsSchema.parse(params);
    assertNotSelf(actorUserId, id, "You cannot remove yourself");
    await removeAdminUser({ handler: context.handler, headers: request.headers, userId: id });
    await recordAdminAuditLog(db, {
      actorUserId,
      targetUserId: id,
      action: "user_removed",
    });
    return { success: true as const };
  });
  return routes;
}
