import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert as NativeAlert, ScrollView, StyleSheet } from "react-native";
import { useState } from "react";

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
import { NutritionSummary } from "../../components/NutritionSummary";
import { useI18n } from "../../i18n/context";
import { formatReadableDate } from "../../lib/dates";
import { formatGrams, formatKcal, formatMealTime } from "../../lib/format";
import { fetchMeal, MealNotFoundError, removeMeal } from "../../lib/meals";

export function MealDetailScreen() {
  const { copy, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = useThemeColors();
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
              await invalidateMealQueries(queryClient);
              await queryClient.invalidateQueries({ queryKey: [{ _id: "getCalendarMonth" }] });
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
          {mealQuery.error instanceof MealNotFoundError ? (
            <Stack gap="xs">
              <Text variant="headingMd">{copy.meal.notFoundTitle}</Text>
              <Text tone="secondary">{copy.meal.notFoundBody}</Text>
            </Stack>
          ) : (
            <>
              <Alert tone="danger" message={copy.meal.loadError} />
              <Button variant="ghost" onPress={() => void mealQuery.refetch()}>
                {copy.meal.retry}
              </Button>
            </>
          )}
        </Stack>
      </Screen>
    );
  }

  const meal = mealQuery.data;
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
              {copy.meal.detailEyebrow}
            </Text>
            <Text variant="title">{meal.name}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.meal.detailDate(
                copy.meal.categories[meal.category],
                formatReadableDate(meal.date, locale),
                formatMealTime(meal.createdAt, locale),
              )}
            </Text>
          </Stack>

          <NutritionSummary
            calories={meal.calories}
            carbohydrates={meal.carbohydratesGrams}
            fat={meal.fatGrams}
            incomplete={meal.nutritionIncomplete}
            protein={meal.proteinGrams}
            showTarget={false}
          />
          {deleteError ? <Alert tone="danger" message={copy.meal.deleteError} /> : null}

          {meal.entries?.length ? (
            <Surface elevation="none">
              <Stack gap="sm">
                <Text variant="label">{copy.food.selectedFoods}</Text>
                {meal.entries.map((entry) => (
                  <MealEntryRow
                    key={entry.id}
                    calories={formatKcal(entry.energyKcal, locale)}
                    detail={`${entry.portionName} · ${formatGrams(entry.grams, locale)}`}
                    name={entry.foodName}
                  />
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

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
});

function invalidateMealQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [{ _id: "getDailyMeals" }] }),
    queryClient.invalidateQueries({ queryKey: [{ _id: "getMealDiary" }] }),
  ]);
}
