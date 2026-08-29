import Constants from "expo-constants";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
const configuredScheme = Constants.expoConfig?.scheme;

export const apiUrl = (configuredApiUrl ?? "http://localhost:3000").replace(/\/$/, "");
export const appScheme =
  typeof configuredScheme === "string" ? configuredScheme : (configuredScheme?.[0] ?? "boccone");
