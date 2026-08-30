import { expoClient } from "@better-auth/expo/client";
import { createAuthClient, type ReactAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { apiUrl, appScheme } from "../config";

export const authClient: ReactAuthClient<{
  baseURL: string;
  plugins: ReturnType<typeof expoClient>[];
}> = createAuthClient({
  baseURL: apiUrl,
  plugins: [
    expoClient({
      scheme: appScheme,
      storagePrefix: "boccone",
      storage: SecureStore,
    }),
  ],
});

export async function fetchWithSession(path: string, init: RequestInit = {}): Promise<Response> {
  const cookie = await authClient.getCookie();
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  return fetch(`${apiUrl}${path}`, { ...init, headers, credentials: "omit" });
}
