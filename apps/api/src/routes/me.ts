import { type AnyElysia } from "elysia";

import type { BocconeAuth } from "@boccone/auth";
import { meResponseSchema } from "@boccone/contracts";

import { createRequireAuth } from "../middleware/auth";
import { getRequest, type RouteContext } from "./context";

/** Routes available to any authenticated user. */
export function createMeRoutes(auth: BocconeAuth): AnyElysia {
  const routes = createRequireAuth(auth).get("/api/me", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return new Response(null, { status: 401 });
    }
    return meResponseSchema.parse({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: session.user.image ?? null,
        role: session.user.role ?? "user",
      },
    });
  });
  return routes;
}
