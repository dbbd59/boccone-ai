import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { useCallback, useEffect, useState } from "react";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";

import { ThemeProvider } from "@boccone/ui-mobile";
import type { ColorMode } from "@boccone/design-tokens";

import { I18nProvider } from "../i18n/provider";
import { SessionProvider } from "../session";
import { QueryProvider } from "../providers/query-provider";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const [colorMode, setColorMode] = useState<ColorMode>("system");

  useEffect(() => {
    let active = true;
    void readColorMode().then((stored) => {
      if (active && stored) setColorMode(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleColorModeChange = useCallback((next: ColorMode) => {
    setColorMode(next);
    void persistColorMode(next);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider colorMode={colorMode} onColorModeChange={handleColorModeChange}>
      <I18nProvider>
        <QueryProvider>
          <SessionProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </SessionProvider>
        </QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

const COLOR_MODE_STORAGE_KEY = "boccone.color-mode";

async function readColorMode(): Promise<ColorMode | null> {
  try {
    const value =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)
        : await SecureStore.getItemAsync(COLOR_MODE_STORAGE_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : null;
  } catch {
    return null;
  }
}

async function persistColorMode(mode: ColorMode): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
      return;
    }
    await SecureStore.setItemAsync(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable in private browsing or restricted profiles.
  }
}
