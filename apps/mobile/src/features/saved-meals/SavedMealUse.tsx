import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  GlassIconButton,
  Screen,
  Stack,
  Surface,
  Text,
  useThemeColors,
} from "@boccone/ui-mobile";

import { MealEntryRow } from "../../components/MealEntryRow";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { useI18n } from "../../i18n/context";
import { formatGrams, formatNumber } from "../../lib/format";
import { fetchSavedMeal, SavedMealNotFoundError } from "../../lib/saved-meals";

export function SavedMealUse({ savedMealId }: { savedMealId?: string }) {
  const { copy, locale } = useI18n();
  const router = useRouter();
  const colors = useThemeColors();
  const [error, setError] = useState<string | null>(null);

  const savedQuery = useQueryLike(savedMealId);

  const begin = useMutation({
    mutationFn: () => {
      if (!savedMealId) throw new Error("missing template");
      // Continue into the composer pre-filled from the template. Usage is
      // recorded only after the resulting meal is persisted (see MealComposer).
      router.replace({
        pathname: "/meals/new",
        params: { fromSavedMeal: savedMealId },
      });
      return Promise.resolve();
    },
  });

  if (!savedMealId) {
    return (
      <Screen>
        <Alert tone="danger" message={copy.saved.loadError} />
      </Screen>
    );
  }

  if (savedQuery.pending) {
    return (
      <Screen>
        <LoadingSkeleton label={copy.meal.loading} />
      </Screen>
    );
  }

  if (savedQuery.failed || !savedQuery.meal) {
    return (
      <Screen>
        <Stack gap="md">
          <GlassIconButton
            accessibilityLabel={copy.navigation.back}
            icon={
              <MaterialCommunityIcons
                color={colors.foreground.default}
                name="chevron-left"
                size={22}
              />
            }
            onPress={() => router.back()}
          />
          <Alert
            tone="danger"
            message={savedQuery.notFound ? copy.meal.notFoundTitle : copy.saved.loadError}
          />
        </Stack>
      </Screen>
    );
  }

  const meal = savedQuery.meal;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <GlassIconButton
            accessibilityLabel={copy.navigation.back}
            icon={
              <MaterialCommunityIcons
                color={colors.foreground.default}
                name="chevron-left"
                size={22}
              />
            }
            onPress={() => router.back()}
          />
          <Stack gap="sm">
            <Text variant="caption" tone="brand">
              {copy.saved.title}
            </Text>
            <Text variant="title">{meal.name}</Text>
            {meal.routine ? (
              <Text variant="bodyLg" tone="secondary">
                {copy.saved.schedulePreview(
                  formatWeekdays(meal.routine.weekdays, locale),
                  meal.routine.localTime,
                )}
              </Text>
            ) : null}
          </Stack>

          <Surface elevation="none">
            <Stack gap="sm">
              <Text variant="label">{copy.food.selectedFoods}</Text>
              {meal.items.map((item) => (
                <MealEntryRow
                  key={item.id}
                  name={item.foodName ?? item.foodId ?? "?"}
                  detail={`${item.portionName} × ${formatNumber(item.quantity, locale)} · ${formatGrams(item.grams, locale)}`}
                  calories={item.needsAttention ? copy.saved.needsAttention : "—"}
                />
              ))}
            </Stack>
          </Surface>

          {error ? <Alert tone="danger" message={error} /> : null}

          <Stack gap="sm">
            <Button
              fullWidth
              loading={begin.isPending}
              onPress={() => {
                setError(null);
                begin.mutate();
              }}
            >
              {copy.saved.useNow}
            </Button>
            <Link href={{ pathname: "/meals/saved/[id]/edit", params: { id: meal.id } }} asChild>
              <Button fullWidth variant="secondary">
                {copy.saved.edit}
              </Button>
            </Link>
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

import { useQuery } from "@tanstack/react-query";

function useQueryLike(savedMealId?: string) {
  const query = useQuery({
    queryKey: ["saved-meal-use", savedMealId],
    queryFn: () => fetchSavedMeal(savedMealId ?? ""),
    enabled: Boolean(savedMealId),
    retry: false,
  });
  const notFound = query.error instanceof SavedMealNotFoundError;
  return {
    meal: query.data,
    pending: query.isPending,
    failed: query.isError,
    notFound,
  };
}

function formatWeekdays(weekdays: number[], locale: string): string {
  if (weekdays.length === 0) return "";
  const labels = weekdays.map((day) => {
    // 2023-01-02 is a Monday (ISO weekday 0).
    const date = new Date(2023, 0, 2 + day, 12);
    return new Intl.DateTimeFormat(locale, { weekday: "short" })
      .format(date)
      .toLocaleUpperCase(locale);
  });
  return labels.join("-");
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
});
