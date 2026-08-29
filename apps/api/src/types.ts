import type { BocconeSession } from "@boccone/auth";

export type RequestContext = {
  requestId: string;
};

export type AuthenticatedContext = RequestContext & {
  session: BocconeSession;
};
