import type { AnyElysia } from "elysia";

import type { BocconeAuth } from "@boccone/auth";
import type { Database } from "@boccone/db";

import { createAdminUserMutationRoutes } from "./user-mutations";
import { createAdminUserReadRoutes } from "./user-read";

export function createAdminUserRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = createAdminUserReadRoutes(auth);
  routes.use(createAdminUserMutationRoutes(auth, db));
  return routes;
}
