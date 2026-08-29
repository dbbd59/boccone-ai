import type { AnyElysia } from "elysia";

import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { createAdminUserBanRoutes } from "./user-ban";
import { createAdminUserCreateRoutes } from "./user-create";
import { createAdminUserMutationContext } from "./user-mutation-support";
import { createAdminUserRemoveRoutes } from "./user-remove";
import { createAdminUserRoleRoutes } from "./user-role";
import { createAdminUserUpdateRoutes } from "./user-update";

export function createAdminUserMutationRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const context = createAdminUserMutationContext(auth);
  const routes: AnyElysia = createAdminUserCreateRoutes(context, db);
  routes.use(createAdminUserUpdateRoutes(context, db));
  routes.use(createAdminUserRoleRoutes(context, db));
  routes.use(createAdminUserBanRoutes(context, db));
  routes.use(createAdminUserRemoveRoutes(context, db));
  return routes;
}
