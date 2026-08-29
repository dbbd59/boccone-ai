import { useMemo, type PropsWithChildren } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authClient } from "./lib/auth-client";
import { SessionContext, type SessionContextValue } from "./session-context";

export function SessionProvider({ children }: PropsWithChildren) {
  const state = authClient.useSession();
  const queryClient = useQueryClient();
  const value = useMemo<SessionContextValue>(
    () => ({
      session: state.data,
      isPending: state.isPending,
      signOut: async () => {
        await authClient.signOut();
        queryClient.clear();
      },
    }),
    [queryClient, state.data, state.isPending],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
