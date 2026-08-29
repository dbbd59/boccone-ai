import { Elysia, type AnyElysia } from "elysia";

import type { BocconeAuth, BocconeSession } from "@boccone/auth";

import { AppError } from "../errors";
import { errorBody, jsonResponse } from "../errors";

export async function requireSession(
  auth: BocconeAuth,
  request: Request,
  role?: "admin",
): Promise<BocconeSession> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new AppError("unauthorized", "Authentication required");
  if (role === "admin" && session.user.role !== "admin") {
    throw new AppError("forbidden", "Admin privileges required");
  }
  return session;
}

/**
 * Resolve identity from Better Auth's server-side session cookie.
 * Client-supplied user ids are deliberately ignored.
 */
export function createRequireAuth(auth: BocconeAuth, role?: "admin"): AnyElysia {
  return new Elysia({
    name: role === "admin" ? "boccone-admin-guard" : "boccone-auth-guard",
  }).onBeforeHandle(async ({ request }) => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    try {
      await requireSession(auth, request, role);
    } catch (error) {
      if (error instanceof AppError) {
        return jsonResponse(errorBody(error.code, error.message, requestId), error.status);
      }
      throw error;
    }
  });
}

export function createRequireAdmin(auth: BocconeAuth): AnyElysia {
  return createRequireAuth(auth, "admin");
}
