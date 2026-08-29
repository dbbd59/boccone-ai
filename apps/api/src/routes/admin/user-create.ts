import { Elysia, type AnyElysia } from "elysia";

import { adminUserCreateSchema, type AdminUser } from "@boccone/contracts";
import type { Database } from "@boccone/db";

import { recordAdminAuditLog } from "../../services/admin-audit";
import { createAdminUser } from "../../services/admin-user-mutations";
import { type AdminUserMutationContext, requireActorUserId } from "./user-mutation-support";
import { getRequest, type RouteContext } from "../context";

export function createAdminUserCreateRoutes(
  context: AdminUserMutationContext,
  db: Database,
): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-user-create-route" });
  routes.post("/api/admin/users", async (routeContext: RouteContext) => {
    const request = getRequest(routeContext);
    const actorUserId = await requireActorUserId(context.auth, request);
    const data = adminUserCreateSchema.parse(routeContext.body);
    const createdUser = await createAdminUser({
      handler: context.handler,
      headers: request.headers,
      data,
    });
    await recordAdminAuditLog(db, {
      actorUserId,
      targetUserId: createdUser.id,
      action: "user_created",
      metadata: { role: createdUser.role },
    });
    return { user: createdUser } satisfies { user: AdminUser };
  });
  return routes;
}
