import { borderWidths, minTouchTarget, opacities, spacing } from "@boccone/design-tokens";
import { Inline, Stack, Text, useThemeColors } from "@boccone/ui-mobile";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { forwardRef, type ReactNode } from "react";
import {
  View as NativeView,
  Pressable,
  type PressableProps,
  StyleSheet,
  type View,
} from "react-native";

export interface SettingsRowProps extends Omit<PressableProps, "children" | "style"> {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export const SettingsRow = forwardRef<View, SettingsRowProps>(function SettingsRow(
  { title, description, icon, accessibilityLabel, ...pressableProps },
  ref,
) {
  const colors = useThemeColors();

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole={pressableProps.accessibilityRole ?? "button"}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border.subtle },
        pressed && styles.pressed,
      ]}
    >
      <Inline align="center" gap="md">
        {icon ? (
          <NativeView style={[styles.icon, { backgroundColor: colors.background.subtle }]}>
            {icon}
          </NativeView>
        ) : null}
        <Stack gap="xs" style={styles.copy}>
          <Text variant="headingSm">{title}</Text>
          {description ? (
            <Text variant="bodySm" tone="secondary">
              {description}
            </Text>
          ) : null}
        </Stack>
        <MaterialCommunityIcons
          accessibilityElementsHidden
          color={colors.foreground.subtle}
          name="chevron-right"
          size={24}
        />
      </Inline>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchTarget,
    borderBottomWidth: borderWidths.hairline,
    paddingVertical: spacing[3],
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: spacing[10],
    height: spacing[10],
    borderRadius: spacing[10],
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: opacities.pressed,
    transform: [{ scale: 0.99 }],
  },
});
