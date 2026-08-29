import type { BocconeSession } from "@boccone/auth";

export interface RequestContext {
  requestId: string;
}

export interface AuthenticatedContext extends RequestContext {
  session: BocconeSession;
}
