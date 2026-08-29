import { Elysia } from "elysia";

import type { BocconeAuth } from "@boccone/auth";

import { errorBody, jsonResponse } from "../errors";

/**
 * Resolve identity from Better Auth's server-side session cookie.
 * Client-supplied user ids are deliberately ignored.
 */
export function createRequireAuth(auth: BocconeAuth, role?: "admin") {
  return new Elysia({ name: role === "admin" ? "boccone-admin-guard" : "boccone-auth-guard" })
    .derive(async ({ request }) => ({
      session: await auth.api.getSession({ headers: request.headers }),
    }))
    .onBeforeHandle(({ session, request }) => {
      const requestId = request.headers.get("x-request-id") ?? undefined;
      if (!session) {
        return jsonResponse(errorBody("unauthorized", "Authentication required", requestId), 401);
      }
      if (role === "admin" && session.user.role !== "admin") {
        return jsonResponse(errorBody("forbidden", "Admin privileges required", requestId), 403);
      }
    });
}

export function createRequireAdmin(auth: BocconeAuth) {
  return createRequireAuth(auth, "admin");
}
