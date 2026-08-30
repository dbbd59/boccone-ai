import { Elysia, type AnyElysia } from "elysia";

import { adminAiUsageQuerySchema } from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";

import { requireSession } from "../../middleware/auth";
import type { AiService } from "../../services/ai";
import { getRequest, type RouteContext } from "../context";

export function createAdminAiUsageRoutes(auth: BocconeAuth, ai: AiService): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-admin-ai-usage-routes" });
  routes.get("/api/admin/ai/usage", async (context: RouteContext) => {
    const request = getRequest(context);
    await requireSession(auth, request, "admin");
    const params = new URL(request.url).searchParams;
    return ai.listUsage(
      adminAiUsageQuerySchema.parse({
        feature: params.get("feature") ?? undefined,
        provider: params.get("provider") ?? undefined,
        status: params.get("status") ?? undefined,
        limit: params.get("limit") ?? undefined,
        offset: params.get("offset") ?? undefined,
      }),
    );
  });
  return routes;
}
