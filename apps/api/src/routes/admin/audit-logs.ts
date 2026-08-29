import { Elysia, type AnyElysia } from "elysia";

import type { BocconeAuth } from "@boccone/auth";
import { adminAuditLogsQuerySchema } from "@boccone/contracts";
import type { Database } from "@boccone/db";

import { requireSession } from "../../middleware/auth";
import { listAdminAuditLogs } from "../../services/admin-audit";
import { getRequest, type RouteContext } from "../context";

export function createAdminAuditLogRoutes(auth: BocconeAuth, db: Database): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-audit-routes" });
  routes.get("/api/admin/audit-logs", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const searchParams = new URL(request.url).searchParams;
    const query = adminAuditLogsQuerySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });
    return listAdminAuditLogs(db, query);
  });
  return routes;
}
