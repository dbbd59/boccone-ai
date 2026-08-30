import { StyleSheet, View } from "react-native";

import { spacing } from "@boccone/design-tokens";
import { Inline, Stack, Surface, Text, useThemeColors } from "@boccone/ui-mobile";

import { useI18n } from "../i18n/context";

export function NutritionSummary({
  calories,
  target,
  protein,
  carbohydrates,
  fat,
  incomplete = false,
  compact = false,
  showTarget = true,
  label,
}: {
  calories: number | null | undefined;
  target?: number | null;
  protein: number | null | undefined;
  carbohydrates: number | null | undefined;
  fat: number | null | undefined;
  incomplete?: boolean;
  compact?: boolean;
  showTarget?: boolean;
  label?: string;
}) {
  const { copy } = useI18n();
  const colors = useThemeColors();
  const hasTarget = target !== null && target !== undefined && target > 0;
  const progress =
    hasTarget && calories !== null && calories !== undefined
      ? Math.min(Math.max(calories / target, 0), 1)
      : null;

  const content = (
    <Stack gap={compact ? "sm" : "md"}>
      <Inline align="end" justify="between" gap="md">
        <Stack gap="xs" style={styles.copy}>
          <Text variant="caption" tone="secondary">
            {label ?? copy.home.caloriesLabel}
          </Text>
          <Text variant={compact ? "headingLg" : "numeric"}>
            {copy.home.caloriesValue(calories)}
          </Text>
        </Stack>
        {showTarget ? (
          <Text variant="bodySm" tone="secondary" style={styles.target}>
            {hasTarget ? copy.home.caloriesTarget(target ?? 0) : copy.home.caloriesUnset}
          </Text>
        ) : null}
      </Inline>
      {progress !== null ? (
        <View
          accessibilityLabel={copy.home.caloriesTarget(target ?? 0)}
          accessibilityRole="progressbar"
          style={[styles.progressTrack, { backgroundColor: colors.background.subtle }]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.interactive.default, width: `${progress * 100}%` },
            ]}
          />
        </View>
      ) : null}
      <Inline gap="sm" align="start">
        <Macro label={copy.home.proteinLabel} value={protein} color={colors.nutrition.protein} />
        <Macro
          label={copy.home.carbohydratesLabel}
          value={carbohydrates}
          color={colors.nutrition.carbs}
        />
        <Macro label={copy.home.fatLabel} value={fat} color={colors.nutrition.fat} />
      </Inline>
      {incomplete ? (
        <Text variant="caption" tone="secondary">
          {copy.food.approximate}
        </Text>
      ) : null}
    </Stack>
  );

  return compact ? (
    <Surface elevation="none" style={styles.compactSurface}>
      {content}
    </Surface>
  ) : (
    <Surface style={styles.surface}>{content}</Surface>
  );
}

function Macro({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null | undefined;
  color: string;
}) {
  const { copy } = useI18n();
  return (
    <Stack gap="xs" style={[styles.macro, { borderTopColor: color }]}>
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="headingSm">{copy.home.gramsValue(value)}</Text>
    </Stack>
  );
}

const styles = StyleSheet.create({
  surface: {
    padding: spacing[5],
  },
  compactSurface: {
    padding: spacing[4],
  },
  copy: {
    flex: 1,
  },
  target: {
    flexShrink: 1,
    textAlign: "right",
  },
  progressTrack: {
    height: spacing[1],
    borderRadius: spacing[1],
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: spacing[1],
  },
  macro: {
    flex: 1,
    minWidth: 0,
    borderTopWidth: 2,
    paddingTop: spacing[2],
  },
});
