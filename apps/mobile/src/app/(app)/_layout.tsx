import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

import { LoadingScreen } from "../../components/LoadingScreen";
import { useI18n } from "../../i18n/context";
import { useSession } from "../../session-context";
import { useTheme } from "@boccone/ui-mobile";

export default function AuthenticatedLayout() {
  const { session, isPending } = useSession();
  const { copy } = useI18n();
  const { colors, themeName } = useTheme();
  if (isPending) return <LoadingScreen />;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  const baseTheme = themeName === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background.default,
      card: colors.background.default,
      border: colors.border.subtle,
      primary: colors.interactive.default,
      text: colors.foreground.default,
      notification: colors.status.danger,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <NativeTabs
        tintColor={colors.interactive.default}
        labelStyle={{ color: colors.foreground.muted }}
        minimizeBehavior="onScrollDown"
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>{copy.navigation.home}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>{copy.navigation.settings}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "gearshape", selected: "gearshape.fill" }}
            md="settings"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </NavigationThemeProvider>
  );
}
