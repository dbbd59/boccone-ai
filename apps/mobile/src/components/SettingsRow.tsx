import { forwardRef } from "react";
import { Pressable, StyleSheet, type PressableProps, type View } from "react-native";

import { borderWidths, minTouchTarget, opacities, shape, spacing } from "@boccone/design-tokens";
import { Inline, Stack, Text, useThemeColors } from "@boccone/ui-mobile";

export interface SettingsRowProps extends Omit<PressableProps, "children" | "style"> {
  title: string;
  description?: string;
}

export const SettingsRow = forwardRef<View, SettingsRowProps>(function SettingsRow(
  { title, description, accessibilityLabel, ...pressableProps },
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
        {
          backgroundColor: colors.background.elevated,
          borderColor: colors.border.subtle,
        },
        pressed && styles.pressed,
      ]}
    >
      <Inline align="center" gap="md" justify="between">
        <Stack gap="xs" style={styles.copy}>
          <Text variant="headingSm">{title}</Text>
          {description ? (
            <Text variant="bodySm" tone="secondary">
              {description}
            </Text>
          ) : null}
        </Stack>
        <Text accessibilityElementsHidden variant="headingMd" tone="brand">
          ›
        </Text>
      </Inline>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchTarget,
    borderRadius: shape.surface,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
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
