import { createContext, useContext } from "react";

import type { authClient } from "./lib/auth-client";

type AuthClientSessionState = ReturnType<typeof authClient.useSession>;
export type MobileSession = AuthClientSessionState["data"];

export interface SessionContextValue {
  session: MobileSession;
  isPending: boolean;
  signOut: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
