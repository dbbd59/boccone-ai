import { Elysia, type AnyElysia } from "elysia";

import { healthResponseSchema } from "@boccone/contracts";

/** Public operational health endpoint. */
export function createHealthRoutes(version: string): AnyElysia {
  return new Elysia({ name: "boccone-health-routes" }).get("/api/health", ({ request, set }) => {
    const requestId = request.headers.get("x-request-id") ?? "unknown";
    set.headers["X-Request-Id"] = requestId;
    return healthResponseSchema.parse({
      status: "ok",
      service: "boccone-api",
      version,
      requestId,
      timestamp: new Date().toISOString(),
    });
  });
}
