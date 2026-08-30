import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useMemo } from "react";

import { fontFamilies, spacing, typography } from "@boccone/design-tokens";
import { useI18n } from "../../../i18n/context";
import { useTheme } from "@boccone/ui-mobile";

export default function WebTabsLayout() {
  const { copy } = useI18n();
  const { colors } = useTheme();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: colors.interactive.default,
      tabBarInactiveTintColor: colors.foreground.muted,
      tabBarStyle: {
        backgroundColor: colors.background.elevated,
        borderTopColor: colors.border.subtle,
        borderTopWidth: 1,
        height: spacing[12],
        paddingBottom: spacing[2],
        paddingTop: spacing[2],
      },
      tabBarLabelStyle: {
        fontFamily: fontFamilies.semibold,
        fontSize: typography.caption.fontSize,
      },
    }),
    [colors],
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: copy.navigation.home,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="home-variant-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: copy.navigation.meals,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="silverware-fork-knife" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: copy.navigation.calendar,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="calendar-month-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: copy.navigation.diary,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              color={color}
              name="book-open-page-variant-outline"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: copy.navigation.settings,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="cog-outline" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
