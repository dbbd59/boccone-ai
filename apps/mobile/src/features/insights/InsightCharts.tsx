import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { NativeSyntheticEvent, NativeTouchEvent } from "react-native";

import type { InsightsMetric, PersonalInsightBucket } from "@boccone/api-client";
import { borderWidths, minTouchTarget, radii, spacing } from "@boccone/design-tokens";
import { Inline, Stack, Text, useThemeColors } from "@boccone/ui-mobile";

import type { Locale, TranslationCopy } from "../../i18n/translations";
import { formatReadableDate } from "../../lib/dates";
import { formatNumber } from "../../lib/format";

const chartHeight = spacing[20] * 2;

export function InsightTrendChart({
  buckets,
  metric,
  locale,
  copy,
  referenceValue,
}: {
  buckets: PersonalInsightBucket[];
  metric: InsightsMetric;
  locale: Locale;
  copy: TranslationCopy;
  referenceValue?: number | null;
}) {
  const colors = useThemeColors();
  const [selectedIndex, setSelectedIndex] = useState(() => findLatestLoggedIndex(buckets));
  const [chartWidth, setChartWidth] = useState(0);
  const values = buckets.map((bucket) => metricValue(bucket, metric));
  const maxValue = Math.max(...values.filter((value): value is number => value !== null), 1);
  const chartMax = Math.max(maxValue, referenceValue ?? 0, 1);
  const selectedBucket = buckets[selectedIndex];
  const selectedValue = selectedBucket ? metricValue(selectedBucket, metric) : null;
  const numericValues = values.filter((value): value is number => value !== null);
  const average = weightedAverage(values, buckets);
  const highest = numericValues.length > 0 ? Math.max(...numericValues) : 0;
  const lowest = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const accessibilityLabel = copy.insights.chartAccessibility(
    copy.insights.metricLabels[metric],
    formatMetric(average, metric, locale),
    formatMetric(highest, metric, locale),
    formatMetric(lowest, metric, locale),
    referenceValue === null || referenceValue === undefined
      ? undefined
      : copy.insights.currentTarget(referenceValue),
  );

  function selectFromTouch(event: NativeSyntheticEvent<NativeTouchEvent>) {
    if (chartWidth <= 0 || buckets.length === 0) return;
    const nextIndex = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor((event.nativeEvent.locationX / chartWidth) * buckets.length)),
    );
    if (nextIndex !== selectedIndex) setSelectedIndex(nextIndex);
  }

  return (
    <Stack gap="sm">
      <Text accessibilityRole="text" tone="secondary" variant="caption">
        {accessibilityLabel}
      </Text>
      <View accessible={false}>
        <View
          onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
          onTouchMove={selectFromTouch}
          onTouchStart={selectFromTouch}
          style={styles.chart}
        >
          {referenceValue !== null && referenceValue !== undefined && referenceValue > 0 ? (
            <View
              pointerEvents="none"
              style={[
                styles.referenceLine,
                {
                  bottom: spacing[8] + (referenceValue / chartMax) * chartHeight,
                },
              ]}
            >
              <View style={[styles.referenceStroke, { backgroundColor: colors.border.strong }]} />
              <Text
                style={{ backgroundColor: colors.background.default }}
                tone="secondary"
                variant="caption"
              >
                {formatMetric(referenceValue, "calories", locale)}
              </Text>
            </View>
          ) : null}
          {buckets.map((bucket, index) => {
            const value = values[index];
            const height =
              value === null ? 0 : Math.max(spacing[1], (value / chartMax) * chartHeight);
            const isSelected = index === selectedIndex;
            const labelVisible = index === 0 || index === buckets.length - 1 || isSelected;
            return (
              <Pressable
                accessibilityLabel={bucketAccessibilityLabel(bucket, value, metric, locale, copy)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={bucket.key}
                onPress={() => setSelectedIndex(index)}
                style={styles.column}
              >
                <View style={styles.barSlot}>
                  <View
                    style={[
                      styles.bar,
                      { backgroundColor: colors.interactive.default, height },
                      value === null && styles.emptyBar,
                      isSelected && { backgroundColor: colors.nutrition.protein },
                    ]}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.axisLabel, !labelVisible && styles.hiddenLabel]}
                  tone="secondary"
                  variant="caption"
                >
                  {formatShortDate(bucket.start, locale)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Inline align="center" justify="between" gap="sm">
        <Stack gap="xs" style={styles.selectedCopy}>
          <Text variant="headingSm">
            {selectedBucket
              ? formatReadableDate(selectedBucket.start, locale, { dateStyle: "medium" })
              : "—"}
          </Text>
          <Text tone="secondary" variant="bodySm">
            {selectedBucket?.logged
              ? formatMetric(selectedValue, metric, locale)
              : copy.insights.noRangeData}
          </Text>
        </Stack>
        <Text tone="secondary" variant="caption">
          {copy.insights.metricLabels[metric]}
        </Text>
      </Inline>
    </Stack>
  );
}

export function MacroComposition({
  copy,
  locale,
  onSelect,
  averages,
}: {
  copy: TranslationCopy;
  locale: Locale;
  onSelect: (metric: InsightsMetric) => void;
  averages: {
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
}) {
  const colors = useThemeColors();
  const total = (averages.protein ?? 0) + (averages.carbs ?? 0) + (averages.fat ?? 0);

  return (
    <Stack gap="md">
      <View
        accessibilityLabel={`${copy.insights.metricLabels.protein}, ${formatNumber(averages.protein, locale, 1)} g. ${copy.insights.metricLabels.carbs}, ${formatNumber(averages.carbs, locale, 1)} g. ${copy.insights.metricLabels.fat}, ${formatNumber(averages.fat, locale, 1)} g.`}
        accessibilityRole="image"
        style={styles.macroTrack}
      >
        <View
          style={{
            backgroundColor: colors.nutrition.protein,
            flex: ratio(averages.protein ?? 0, total),
          }}
        />
        <View
          style={{
            backgroundColor: colors.nutrition.carbs,
            flex: ratio(averages.carbs ?? 0, total),
          }}
        />
        <View
          style={{ backgroundColor: colors.nutrition.fat, flex: ratio(averages.fat ?? 0, total) }}
        />
      </View>
      <View style={styles.macroGrid}>
        <MacroItem
          color={colors.nutrition.protein}
          label={copy.insights.metricLabels.protein}
          metric="protein"
          onPress={onSelect}
          value={averages.protein}
          locale={locale}
        />
        <MacroItem
          color={colors.nutrition.carbs}
          label={copy.insights.metricLabels.carbs}
          metric="carbs"
          onPress={onSelect}
          value={averages.carbs}
          locale={locale}
        />
        <MacroItem
          color={colors.nutrition.fat}
          label={copy.insights.metricLabels.fat}
          metric="fat"
          onPress={onSelect}
          value={averages.fat}
          locale={locale}
        />
      </View>
    </Stack>
  );
}

function MacroItem({
  color,
  label,
  metric,
  onPress,
  value,
  locale,
}: {
  color: string;
  label: string;
  metric: InsightsMetric;
  onPress: (metric: InsightsMetric) => void;
  value: number | null;
  locale: Locale;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${formatNumber(value, locale, 1)} g`}
      accessibilityRole="button"
      onPress={() => onPress(metric)}
      style={styles.macroItem}
    >
      <Inline gap="xs">
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text numberOfLines={1} tone="secondary" variant="caption">
          {label}
        </Text>
      </Inline>
      <Text variant="headingSm">{formatNumber(value, locale, 1)} g</Text>
    </Pressable>
  );
}

export function RankedMealTypes({
  items,
  copy,
  locale,
}: {
  items: {
    category: keyof TranslationCopy["insights"]["categoryLabels"];
    meals: number;
    share: number;
    calorieShare: number;
  }[];
  copy: TranslationCopy;
  locale: Locale;
}) {
  const colors = useThemeColors();
  const max = Math.max(...items.map((item) => item.calorieShare), 1);
  return (
    <Stack gap="sm">
      {items.map((item) => (
        <Stack gap="xs" key={item.category}>
          <Inline justify="between" gap="sm">
            <Text variant="bodySm">{copy.insights.categoryLabels[item.category]}</Text>
            <Text tone="secondary" variant="caption">
              {copy.insights.mealTypeShare(
                formatNumber(item.calorieShare * 100, locale, 0),
                item.meals,
              )}
            </Text>
          </Inline>
          <View style={[styles.rankTrack, { backgroundColor: colors.background.subtle }]}>
            <View
              style={[
                styles.rankFill,
                { backgroundColor: colors.interactive.default, flex: item.calorieShare / max },
              ]}
            />
            <View style={{ flex: 1 - item.calorieShare / max }} />
          </View>
        </Stack>
      ))}
    </Stack>
  );
}

function metricValue(bucket: PersonalInsightBucket, metric: InsightsMetric): number | null {
  switch (metric) {
    case "calories":
      return bucket.calories;
    case "protein":
      return bucket.proteinGrams;
    case "carbs":
      return bucket.carbohydratesGrams;
    case "fat":
      return bucket.fatGrams;
  }
}

function weightedAverage(values: (number | null)[], buckets: PersonalInsightBucket[]): number {
  let total = 0;
  let weight = 0;
  values.forEach((value, index) => {
    const bucketWeight = buckets[index]?.loggedDays ?? (value === null ? 0 : 1);
    if (value !== null && bucketWeight > 0) {
      total += value * bucketWeight;
      weight += bucketWeight;
    }
  });
  return weight === 0 ? 0 : total / weight;
}

function ratio(value: number, total: number): number {
  return total === 0 ? 0 : value / total;
}

function findLatestLoggedIndex(buckets: PersonalInsightBucket[]): number {
  const index = [...buckets].reverse().findIndex((bucket) => bucket.logged);
  return index === -1 ? 0 : buckets.length - 1 - index;
}

function formatMetric(value: number | null, metric: InsightsMetric, locale: Locale): string {
  const unit = metric === "calories" ? "kcal" : "g";
  return value === null
    ? "—"
    : `${formatNumber(value, locale, metric === "calories" ? 0 : 1)} ${unit}`;
}

function formatShortDate(value: string, locale: Locale): string {
  return formatReadableDate(value, locale, { day: "numeric", month: "short" });
}

function bucketAccessibilityLabel(
  bucket: PersonalInsightBucket,
  value: number | null,
  metric: InsightsMetric,
  locale: Locale,
  copy: TranslationCopy,
): string {
  return `${formatReadableDate(bucket.start, locale, { dateStyle: "medium" })}. ${
    bucket.logged ? formatMetric(value, metric, locale) : copy.insights.noRangeData
  }`;
}

const styles = StyleSheet.create({
  chart: {
    height: chartHeight + spacing[8],
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing[1],
    paddingTop: spacing[2],
    position: "relative",
  },
  referenceLine: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  referenceStroke: {
    height: borderWidths.hairline,
    flex: 1,
  },
  column: {
    minHeight: minTouchTarget,
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing[1],
  },
  barSlot: {
    width: "100%",
    height: chartHeight,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "70%",
    minWidth: spacing[1],
    borderRadius: radii.sm,
  },
  emptyBar: {
    opacity: 0,
  },
  axisLabel: {
    maxWidth: spacing[10],
    textAlign: "center",
  },
  hiddenLabel: {
    opacity: 0,
  },
  selectedCopy: {
    flex: 1,
  },
  macroTrack: {
    height: spacing[4],
    overflow: "hidden",
    flexDirection: "row",
    borderRadius: radii.pill,
  },
  macroGrid: {
    flexDirection: "row",
    gap: spacing[2],
  },
  macroItem: {
    minHeight: minTouchTarget,
    flex: 1,
    gap: spacing[1],
  },
  legendDot: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: radii.pill,
  },
  rankTrack: {
    minHeight: spacing[2],
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: radii.pill,
  },
  rankFill: {
    minWidth: spacing[1],
    borderRadius: radii.pill,
  },
});
