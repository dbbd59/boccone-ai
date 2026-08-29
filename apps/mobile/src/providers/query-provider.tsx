import { focusManager, onlineManager, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { AppState, Platform } from "react-native";
import * as Network from "expo-network";

import { configureApiClient } from "@boccone/api-client/client";

import { apiUrl } from "../config";
import { authClient } from "../lib/auth-client";
import { queryClient } from "./query-client";

// Browsers send the HttpOnly session cookie with credentials: include; native
// clients cannot rely on browser cookie handling and use the SecureStore value.
configureApiClient(apiUrl, Platform.OS === "web" ? undefined : () => authClient.getCookie());

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      onlineManager.setOnline(state.isConnected ?? false);
    });

    void Network.getNetworkStateAsync()
      .then((state) => onlineManager.setOnline(state.isConnected ?? false))
      .catch(() => onlineManager.setOnline(true));

    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
