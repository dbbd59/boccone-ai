import { Elysia } from "elysia";

import { healthResponseSchema } from "@boccone/contracts";

/** Public operational health endpoint. */
export function createHealthRoutes(version: string) {
  return new Elysia({ name: "boccone-health-routes" }).get("/api/health", ({ request }) => {
    const requestId = request.headers.get("x-request-id") ?? "unknown";
    return healthResponseSchema.parse({
      status: "ok",
      service: "boccone-api",
      version,
      requestId,
      timestamp: new Date().toISOString(),
    });
  });
}
