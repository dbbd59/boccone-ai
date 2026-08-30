import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { parseAdminRoute, type AdminRoute } from "./navigation";

export interface NavigationContextValue {
  route: AdminRoute;
  locationKey: string;
  navigate: (path: string, replace?: boolean) => void;
}

export const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useAdminRouter(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useAdminRouter must be used inside <AdminNavigationProvider>");
  return context;
}

export function useAdminHistory(): NavigationContextValue {
  const [route, setRoute] = useState(() => parseAdminRoute(window.location.pathname));
  const [locationKey, setLocationKey] = useState(readLocationKey);

  const syncLocation = useCallback(() => {
    setRoute(parseAdminRoute(window.location.pathname));
    setLocationKey(readLocationKey());
  }, []);

  useEffect(() => {
    const onPopState = () => syncLocation();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [syncLocation]);

  const navigate = useCallback(
    (path: string, replace = false) => {
      if (replace) window.history.replaceState({}, "", path);
      else window.history.pushState({}, "", path);
      syncLocation();
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    [syncLocation],
  );

  return { route, locationKey, navigate };
}

function readLocationKey(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
