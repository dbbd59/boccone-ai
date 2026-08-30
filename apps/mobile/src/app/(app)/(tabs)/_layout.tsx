import { NativeTabs } from "expo-router/unstable-native-tabs";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

import { useI18n } from "../../../i18n/context";
import { useTheme } from "@boccone/ui-mobile";

export default function AuthenticatedTabsLayout() {
  const { copy } = useI18n();
  const { colors, themeName } = useTheme();
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
        iconColor={{ default: colors.foreground.muted, selected: colors.interactive.default }}
        labelStyle={{
          default: { color: colors.foreground.muted },
          selected: { color: colors.interactive.default },
        }}
        minimizeBehavior="onScrollDown"
        disableTransparentOnScrollEdge
        backBehavior="history"
        labelVisibilityMode="labeled"
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>{copy.navigation.home}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="meals">
          <NativeTabs.Trigger.Label>{copy.navigation.meals}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "fork.knife", selected: "fork.knife.circle.fill" }}
            md="restaurant"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="calendar">
          <NativeTabs.Trigger.Label>{copy.navigation.calendar}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "calendar", selected: "calendar.circle.fill" }}
            md="calendar_month"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="diary">
          <NativeTabs.Trigger.Label>{copy.navigation.diary}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "book.closed", selected: "book.closed.fill" }}
            md="menu_book"
          />
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
