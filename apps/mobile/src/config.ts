import Constants from "expo-constants";

interface ExpoConfigShape {
  scheme?: string | string[] | null;
}

// Keep this direct so Expo's Metro transform embeds EXPO_PUBLIC_API_URL in
// native and web bundles at build time.
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
const expoConfig: unknown = Constants.expoConfig;
const configuredScheme =
  typeof expoConfig === "object" && expoConfig !== null
    ? (expoConfig as ExpoConfigShape).scheme
    : undefined;

export const apiUrl = (configuredApiUrl ?? "http://localhost:3000").replace(/\/$/, "");
export const appScheme =
  typeof configuredScheme === "string" ? configuredScheme : (configuredScheme?.[0] ?? "boccone");
