import type { ReactNode } from "react";

import { NavigationContext, type NavigationContextValue } from "./navigation-context";

export function AdminNavigationProvider({
  route,
  locationKey,
  navigate,
  children,
}: NavigationContextValue & { children: ReactNode }) {
  return (
    <NavigationContext.Provider value={{ route, locationKey, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}
