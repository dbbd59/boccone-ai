import { forwardRef } from "react";
import { Pressable, StyleSheet, type PressableProps, type View } from "react-native";

import { borderWidths, minTouchTarget, opacities, shape, spacing } from "@boccone/design-tokens";
import { Inline, Stack, Text, useThemeColors } from "@boccone/ui-mobile";

export interface MealListItemProps extends Omit<PressableProps, "children" | "style"> {
  title: string;
  meta: string;
}

export const MealListItem = forwardRef<View, MealListItemProps>(function MealListItem(
  { title, meta, accessibilityLabel, ...pressableProps },
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
        styles.item,
        {
          backgroundColor: colors.background.elevated,
          borderColor: colors.border.subtle,
        },
        pressed && styles.pressed,
      ]}
    >
      <Inline align="center" gap="md" justify="between">
        <Stack gap="xs" style={styles.copy}>
          <Text numberOfLines={2} variant="headingSm">
            {title}
          </Text>
          <Text numberOfLines={1} variant="bodySm" tone="secondary">
            {meta}
          </Text>
        </Stack>
        <Text accessibilityElementsHidden variant="headingMd" tone="brand">
          ›
        </Text>
      </Inline>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  item: {
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
