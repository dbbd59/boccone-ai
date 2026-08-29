import Constants from "expo-constants";

interface ExpoConfigShape {
  scheme?: string | string[] | null;
}

const configuredApiUrl = readStringProperty(
  readProperty(readProperty(globalThis, "process"), "env"),
  "EXPO_PUBLIC_API_URL",
);
const expoConfig: unknown = Constants.expoConfig;
const configuredScheme =
  typeof expoConfig === "object" && expoConfig !== null
    ? (expoConfig as ExpoConfigShape).scheme
    : undefined;

export const apiUrl = (configuredApiUrl ?? "http://localhost:3000").replace(/\/$/, "");
export const appScheme =
  typeof configuredScheme === "string" ? configuredScheme : (configuredScheme?.[0] ?? "boccone");

function readProperty(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  return (value as Record<string, unknown>)[key];
}

function readStringProperty(value: unknown, key: string): string | undefined {
  const result = readProperty(value, key);
  return typeof result === "string" ? result : undefined;
}
