import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Alert as NativeAlert, ScrollView, StyleSheet } from "react-native";
import { useState } from "react";

import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  GlassButton,
  Inline,
  Screen,
  Stack,
  Surface,
  Text,
} from "@boccone/ui-mobile";

import { useI18n } from "../../i18n/context";
import { formatReadableDate } from "../../lib/dates";
import { fetchMeal, removeMeal } from "../../lib/meals";

export function MealDetailScreen() {
  const { copy, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ mealId?: string }>();
  const mealId = typeof params.mealId === "string" ? params.mealId : "";
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const mealQuery = useQuery({
    queryKey: ["mobile-meal", mealId],
    queryFn: () => fetchMeal(mealId),
    enabled: mealId.length > 0,
  });

  if (!mealId) {
    return (
      <Screen>
        <Alert tone="danger" message={copy.meal.loadError} />
      </Screen>
    );
  }

  function confirmRemove() {
    if (!mealId || !mealQuery.data) return;
    NativeAlert.alert(copy.meal.deleteTitle, copy.meal.deleteBody, [
      { text: copy.meal.cancel, style: "cancel" },
      {
        text: copy.meal.delete,
        style: "destructive",
        onPress: () => {
          setDeleting(true);
          setDeleteError(false);
          void removeMeal(mealId)
            .then(async () => {
              await queryClient.invalidateQueries({ queryKey: ["getDailyMeals"] });
              queryClient.removeQueries({ queryKey: ["mobile-meal", mealId] });
              router.back();
            })
            .catch(() => setDeleteError(true))
            .finally(() => setDeleting(false));
        },
      },
    ]);
  }

  if (mealQuery.isPending) {
    return (
      <Screen>
        <Text role="status" tone="secondary">
          {copy.meal.loading}
        </Text>
      </Screen>
    );
  }

  if (mealQuery.isError || !mealQuery.data) {
    return (
      <Screen>
        <Stack gap="md">
          <GlassButton onPress={() => router.back()}>{copy.navigation.back}</GlassButton>
          <Alert tone="danger" message={copy.meal.loadError} />
          <Button variant="ghost" onPress={() => void mealQuery.refetch()}>
            {copy.meal.retry}
          </Button>
        </Stack>
      </Screen>
    );
  }

  const meal = mealQuery.data;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <GlassButton onPress={() => router.back()}>{copy.navigation.back}</GlassButton>
          <Stack gap="sm">
            <Text variant="caption" tone="brand">
              {copy.meal.detailEyebrow}
            </Text>
            <Text variant="title">{meal.name}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.meal.detailDate(
                copy.meal.categories[meal.category],
                formatReadableDate(meal.date, locale),
              )}
            </Text>
          </Stack>

          <Surface>
            <Stack gap="lg">
              <Stack gap="xs">
                <Text variant="caption" tone="secondary">
                  {copy.meal.caloriesLabel}
                </Text>
                <Text variant="numeric">{copy.home.caloriesValue(meal.calories)}</Text>
                {meal.nutritionIncomplete ? (
                  <Text variant="bodySm" tone="secondary">
                    {copy.food.approximate}
                  </Text>
                ) : null}
              </Stack>
              {deleteError ? <Alert tone="danger" message={copy.meal.deleteError} /> : null}
              <Stack gap="sm">
                <Text variant="label">{copy.meal.nutritionTitle}</Text>
                <Inline gap="md" align="start">
                  <NutritionValue label={copy.meal.proteinLabel} value={meal.proteinGrams} />
                  <NutritionValue
                    label={copy.meal.carbohydratesLabel}
                    value={meal.carbohydratesGrams}
                  />
                  <NutritionValue label={copy.meal.fatLabel} value={meal.fatGrams} />
                </Inline>
              </Stack>
            </Stack>
          </Surface>

          {meal.entries?.length ? (
            <Surface elevation="none">
              <Stack gap="sm">
                <Text variant="label">{copy.food.selectedFoods}</Text>
                {meal.entries.map((entry) => (
                  <Inline key={entry.id} gap="md" align="start" style={styles.entryRow}>
                    <Stack gap="xs" style={styles.entryCopy}>
                      <Text variant="label">{entry.foodName}</Text>
                      <Text variant="bodySm" tone="secondary">
                        {entry.portionName} · {entry.grams} g
                      </Text>
                    </Stack>
                    <Text variant="label">
                      {entry.energyKcal === null
                        ? "— kcal"
                        : `${Math.round(entry.energyKcal)} kcal`}
                    </Text>
                  </Inline>
                ))}
              </Stack>
            </Surface>
          ) : null}

          {meal.notes ? (
            <Surface elevation="none">
              <Stack gap="xs">
                <Text variant="label">{copy.meal.notesLabel}</Text>
                <Text tone="secondary">{meal.notes}</Text>
              </Stack>
            </Surface>
          ) : null}

          <Stack gap="sm">
            <Link href={{ pathname: "/meals/[mealId]/edit", params: { mealId: meal.id } }} asChild>
              <Button fullWidth>{copy.meal.editAction}</Button>
            </Link>
            <Button
              fullWidth
              loading={deleting}
              variant="destructive"
              disabled={deleting}
              onPress={confirmRemove}
            >
              {copy.meal.delete}
            </Button>
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function NutritionValue({ label, value }: { label: string; value: number | null | undefined }) {
  const { copy } = useI18n();
  return (
    <Stack gap="xs" style={styles.nutritionValue}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="headingSm">{copy.home.gramsValue(value)}</Text>
    </Stack>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  nutritionValue: {
    flex: 1,
  },
  entryRow: {
    justifyContent: "space-between",
  },
  entryCopy: {
    flex: 1,
  },
});
