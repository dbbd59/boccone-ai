import { Stack } from "expo-router";

import { ThemeProvider } from "@boccone/ui-mobile";

import { I18nProvider } from "../i18n/provider";
import { SessionProvider } from "../session";
import { QueryProvider } from "../providers/query-provider";

export default function RootLayout() {
  return (
    <ThemeProvider>
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
