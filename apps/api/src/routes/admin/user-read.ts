import { Elysia, type AnyElysia } from "elysia";

import type { BocconeAuth } from "@boccone/auth";
import { adminUserParamsSchema, adminUsersQuerySchema } from "@boccone/contracts";

import { requireSession } from "../../middleware/auth";
import { getAdminUser, listAdminUsers } from "../../services/admin-users";
import type { BetterAuthHandler } from "../../services/better-auth-admin";
import { getRequest, type RouteContext } from "../context";

export function createAdminUserReadRoutes(auth: BocconeAuth): AnyElysia {
  const handler: BetterAuthHandler = (request) => auth.handler(request);
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-user-read-routes" });
  routes.get("/api/admin/users", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const searchParams = new URL(request.url).searchParams;
    const query = adminUsersQuerySchema.parse({
      search: optionalParam(searchParams.get("search")),
      limit: optionalParam(searchParams.get("limit")),
      offset: optionalParam(searchParams.get("offset")),
    });
    return listAdminUsers({ handler, headers: request.headers, query });
  });
  routes.get("/api/admin/users/:id", async (context: RouteContext) => {
    const request = getRequest(context);
    const params = context.params;
    await requireSession(auth, request, "admin");
    const { id } = adminUserParamsSchema.parse(params);
    return {
      user: await getAdminUser({ handler, headers: request.headers, userId: id }),
    };
  });
  return routes;
}

function optionalParam(value: string | null): string | undefined {
  return value === null || value.length === 0 ? undefined : value;
}
