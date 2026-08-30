import Constants from "expo-constants";

interface ExpoConfigShape {
  scheme?: string | string[] | null;
}

// Keep this direct so Expo's Metro transform embeds EXPO_PUBLIC_API_URL in
// native and web bundles at build time.
const configuredApiUrl: string | undefined =
  typeof process.env.EXPO_PUBLIC_API_URL === "string" ? process.env.EXPO_PUBLIC_API_URL : undefined;
const expoConfig: unknown = Constants.expoConfig;
const configuredScheme =
  typeof expoConfig === "object" && expoConfig !== null
    ? (expoConfig as ExpoConfigShape).scheme
    : undefined;

export const apiUrl = (configuredApiUrl ?? "http://localhost:3000").replace(/\/$/, "");
export const appScheme =
  typeof configuredScheme === "string" ? configuredScheme : (configuredScheme?.[0] ?? "boccone");
