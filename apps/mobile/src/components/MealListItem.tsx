import { MaterialCommunityIcons } from "@expo/vector-icons";
import { forwardRef, type ComponentProps } from "react";
import { Pressable, StyleSheet, View, type PressableProps } from "react-native";

import type { MealCategory } from "@boccone/contracts";
import { borderWidths, minTouchTarget, opacities, spacing } from "@boccone/design-tokens";
import { Inline, Stack, Text, useThemeColors } from "@boccone/ui-mobile";

export interface MealListItemProps extends Omit<PressableProps, "children" | "style"> {
  title: string;
  meta: string;
  kind?: MealCategory;
}

export const MealListItem = forwardRef<View, MealListItemProps>(function MealListItem(
  { title, meta, kind = "snack", accessibilityLabel, ...pressableProps },
  ref,
) {
  const colors = useThemeColors();
  const icon = mealIcon(kind);

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole={pressableProps.accessibilityRole ?? "button"}
      style={({ pressed }) => [
        styles.item,
        { borderBottomColor: colors.border.subtle },
        pressed && styles.pressed,
      ]}
    >
      <Inline align="center" gap="md">
        <View style={[styles.icon, { backgroundColor: colors.background.subtle }]}>
          <MaterialCommunityIcons color={colors.interactive.default} name={icon} size={20} />
        </View>
        <Stack gap="xs" style={styles.copy}>
          <Text numberOfLines={2} variant="headingSm">
            {title}
          </Text>
          <Text numberOfLines={1} variant="bodySm" tone="secondary">
            {meta}
          </Text>
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
  item: {
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

type MealIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

function mealIcon(category: MealCategory): MealIconName {
  switch (category) {
    case "breakfast":
      return "coffee-outline";
    case "lunch":
      return "silverware-fork-knife";
    case "dinner":
      return "food-variant";
    default:
      return "fruit-cherries";
  }
}
