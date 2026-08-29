import type { BocconeAuth } from "@boccone/auth";
import { meResponseSchema } from "@boccone/contracts";

import { createRequireAuth } from "../middleware/auth";

/** Routes available to any authenticated user. */
export function createMeRoutes(auth: BocconeAuth) {
  return createRequireAuth(auth).get("/api/me", ({ session }) => {
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
}
