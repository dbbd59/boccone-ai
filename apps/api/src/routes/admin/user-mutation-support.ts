import type { BocconeAuth } from "@boccone/auth";

import { AppError } from "../../errors";
import { requireSession } from "../../middleware/auth";
import type { BetterAuthHandler } from "../../services/better-auth-admin";

export interface AdminUserMutationContext {
  auth: BocconeAuth;
  handler: BetterAuthHandler;
}

export function createAdminUserMutationContext(auth: BocconeAuth): AdminUserMutationContext {
  return {
    auth,
    handler: (request) => auth.handler(request),
  };
}

export function assertNotSelf(actorUserId: string, targetUserId: string, message: string): void {
  if (actorUserId === targetUserId) throw new AppError("bad_request", message);
}

export async function requireActorUserId(auth: BocconeAuth, request: Request): Promise<string> {
  const session = await requireSession(auth, request, "admin");
  return session.user.id;
}
