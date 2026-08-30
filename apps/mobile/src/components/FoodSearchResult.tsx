import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import type { Food } from "@boccone/api-client";
import { borderWidths, minTouchTarget, opacities, spacing } from "@boccone/design-tokens";
import { GlassIconButton, Inline, Stack, Text, useThemeColors } from "@boccone/ui-mobile";
import { calculateNutrition } from "@boccone/utils";

import { useI18n } from "../i18n/context";

export function FoodSearchResult({
  food,
  onSelect,
  onQuickAdd,
}: {
  food: Food;
  onSelect: () => void;
  onQuickAdd?: () => void;
}) {
  const { copy } = useI18n();
  const colors = useThemeColors();
  const portion = food.portions.find((item) => item.isDefault) ?? food.portions[0];
  const portionKcal = portion
    ? calculateNutrition(
        {
          energyKcal: food.nutritionPer100g.energyKcal,
          proteinG: food.nutritionPer100g.proteinG,
          carbohydratesG: food.nutritionPer100g.carbohydratesG,
          fatG: food.nutritionPer100g.fatG,
          fiberG: food.nutritionPer100g.fiberG,
          sugarG: food.nutritionPer100g.sugarG,
          saturatedFatG: food.nutritionPer100g.saturatedFatG,
          sodiumMg: food.nutritionPer100g.sodiumMg,
        },
        portion.gramWeight,
      ).energyKcal
    : null;
  const context = food.brand ?? food.category ?? null;
  const portionLabel = portion
    ? `${portion.name} · ${formatKcal(portionKcal)}`
    : `${formatKcal(food.nutritionPer100g.energyKcal)} ${copy.food.per100g}`;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border.subtle }]}>
      <Pressable
        accessibilityLabel={`${food.name}. ${portionLabel}`}
        accessibilityRole="button"
        onPress={onSelect}
        style={({ pressed }) => [styles.select, pressed && styles.pressed]}
      >
        <Stack gap="xs" style={styles.copy}>
          <Text variant="headingSm" numberOfLines={2}>
            {food.name}
          </Text>
          <Inline gap="xs" wrap>
            {context ? (
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {context}
              </Text>
            ) : null}
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {portionLabel}
            </Text>
          </Inline>
          <Text variant="caption" tone="muted">
            {qualityLabel(copy, food.qualityLevel)}
          </Text>
        </Stack>
      </Pressable>
      {onQuickAdd ? (
        <GlassIconButton
          accessibilityLabel={copy.food.quickAdd}
          icon={<MaterialCommunityIcons color={colors.interactive.default} name="plus" size={20} />}
          onPress={onQuickAdd}
        />
      ) : null}
    </View>
  );
}

function formatKcal(value: number | null | undefined): string {
  return value === null || value === undefined ? "— kcal" : `≈ ${Math.round(value)} kcal`;
}

function qualityLabel(
  copy: ReturnType<typeof useI18n>["copy"],
  quality: Food["qualityLevel"],
): string {
  switch (quality) {
    case "authoritative":
      return copy.food.quality.authoritative;
    case "branded_label":
      return copy.food.quality.branded;
    case "community_approved":
      return copy.food.quality.community;
    case "user_private":
      return copy.food.quality.personal;
    case "ai_estimated":
      return copy.food.quality.estimated;
    default:
      return copy.food.quality.verified;
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: minTouchTarget,
    borderBottomWidth: borderWidths.hairline,
  },
  select: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingVertical: spacing[3],
    paddingRight: spacing[2],
  },
  copy: {
    minWidth: 0,
  },
  pressed: {
    opacity: opacities.pressed,
  },
});
