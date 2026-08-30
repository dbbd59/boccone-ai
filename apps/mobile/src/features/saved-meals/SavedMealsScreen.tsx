import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert as NativeAlert, RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useState } from "react";

import type { SavedMeal } from "@boccone/api-client";
import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  Inline,
  Screen,
  Stack,
  Surface,
  Text,
  useThemeColors,
} from "@boccone/ui-mobile";

import { EmptyState } from "../../components/EmptyState";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { MascotAvatar } from "../../components/MascotAvatar";
import { useI18n } from "../../i18n/context";
import { fetchSavedMeals, removeSavedMeal } from "../../lib/saved-meals";

/** Deterministic ranking: reminder-enabled routines first, then recency of use, then usage count. */
function rankSavedMeals(meals: SavedMeal[]): SavedMeal[] {
  return [...meals].sort((a, b) => {
    const aReminder = a.routine?.isReminderEnabled ? 1 : 0;
    const bReminder = b.routine?.isReminderEnabled ? 1 : 0;
    if (aReminder !== bReminder) return bReminder - aReminder;
    const aUsed = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const bUsed = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    if (aUsed !== bUsed) return bUsed - aUsed;
    if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount;
    return a.name.localeCompare(b.name);
  });
}

export function SavedMealsScreen() {
  const { copy } = useI18n();
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const savedQuery = useQuery({
    queryKey: ["saved-meals"],
    queryFn: fetchSavedMeals,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeSavedMeal(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["saved-meals"] });
      setDeletingId(null);
    },
    onError: () => setDeletingId(null),
  });

  function confirmRemove(id: string) {
    NativeAlert.alert(copy.saved.deleteTitle, copy.saved.deleteBody, [
      { text: copy.saved.cancel, style: "cancel" },
      {
        text: copy.saved.delete,
        style: "destructive",
        onPress: () => {
          setDeletingId(id);
          deleteMutation.mutate(id);
        },
      },
    ]);
  }

  const meals = savedQuery.data ?? [];
  const routines = rankSavedMeals(meals.filter((m) => m.routine));
  const plainSaved = rankSavedMeals(meals.filter((m) => !m.routine));

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={savedQuery.isRefetching}
            onRefresh={() => void savedQuery.refetch()}
            tintColor={colors.interactive.default}
          />
        }
      >
        <Stack gap="xl">
          <Inline align="center" justify="between" gap="md">
            <Stack gap="xs" style={styles.headerCopy}>
              <Text variant="title">{copy.saved.title}</Text>
              <Text variant="bodySm" tone="secondary">
                {copy.saved.subtitle}
              </Text>
            </Stack>
            <Link href="/meals/saved/new" asChild>
              <Button size="sm">{copy.saved.newSavedMeal}</Button>
            </Link>
          </Inline>

          {savedQuery.isPending ? <LoadingSkeleton label={copy.meal.loading} /> : null}
          {savedQuery.isError ? (
            <Stack gap="sm">
              <Alert tone="danger" message={copy.saved.loadError} />
              <Button variant="ghost" size="sm" onPress={() => void savedQuery.refetch()}>
                {copy.meal.retry}
              </Button>
            </Stack>
          ) : null}

          {savedQuery.data && meals.length === 0 ? (
            <EmptyState
              title={copy.saved.emptyTitle}
              body={copy.saved.emptyBody}
              illustration={<MascotAvatar accessibilityLabel={copy.home.mascotTitle} size={72} />}
            />
          ) : null}

          {routines.length > 0 ? (
            <Stack gap="sm">
              <Text variant="label" tone="secondary">
                {copy.saved.routinesTitle}
              </Text>
              {routines.map((meal) => (
                <SavedMealCard
                  key={meal.id}
                  meal={meal}
                  onDelete={() => confirmRemove(meal.id)}
                  deleting={deletingId === meal.id}
                />
              ))}
            </Stack>
          ) : null}

          {plainSaved.length > 0 ? (
            <Stack gap="sm">
              <Text variant="label" tone="secondary">
                {copy.saved.savedTitle}
              </Text>
              {plainSaved.map((meal) => (
                <SavedMealCard
                  key={meal.id}
                  meal={meal}
                  onDelete={() => confirmRemove(meal.id)}
                  deleting={deletingId === meal.id}
                />
              ))}
            </Stack>
          ) : null}
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function SavedMealCard({
  meal,
  onDelete,
  deleting,
}: {
  meal: SavedMeal;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { copy, locale } = useI18n();
  const colors = useThemeColors();
  const kcal = meal.items.reduce(
    (sum, item) => sum + (item.needsAttention ? 0 : estimateKcal()),
    0,
  );
  const preview = meal.items
    .slice(0, 3)
    .map(({ foodName }) => foodName)
    .join(" · ");

  return (
    <Surface>
      <Stack gap="sm">
        <Inline align="center" justify="between" gap="sm">
          <Text variant="headingSm" numberOfLines={1} style={styles.cardTitle}>
            {meal.name}
          </Text>
          {meal.routine ? (
            <Inline gap="xs" align="center">
              <MaterialCommunityIcons color={colors.interactive.default} name="repeat" size={14} />
              {meal.routine.isReminderEnabled ? (
                <MaterialCommunityIcons
                  color={colors.interactive.default}
                  name="bell-outline"
                  size={14}
                />
              ) : null}
            </Inline>
          ) : null}
        </Inline>
        <Text variant="bodySm" tone="secondary" numberOfLines={1}>
          {preview}
        </Text>
        <Inline align="center" justify="between" gap="sm">
          <Inline gap="sm" align="center">
            <Text variant="caption" tone="secondary">
              {copy.saved.kcalApprox(Math.round(kcal))}
            </Text>
            {meal.routine ? (
              <Text variant="caption" tone="secondary">
                {copy.saved.schedulePreview(
                  formatWeekdays(meal.routine.weekdays, locale),
                  meal.routine.localTime,
                )}
              </Text>
            ) : null}
          </Inline>
          <Inline gap="xs">
            <Button
              size="sm"
              variant="ghost"
              onPress={onDelete}
              disabled={deleting}
              accessibilityLabel={`${copy.saved.delete} ${meal.name}`}
            >
              {copy.saved.delete}
            </Button>
            <Link href={{ pathname: "/meals/saved/[id]/use", params: { id: meal.id } }} asChild>
              <Button size="sm">{copy.saved.use}</Button>
            </Link>
          </Inline>
        </Inline>
        {meal.items.some((item) => item.needsAttention) ? (
          <Inline gap="xs" align="center">
            <MaterialCommunityIcons color={colors.status.warning} name="alert" size={14} />
            <Text variant="caption" style={{ color: colors.status.warning }}>
              {copy.saved.needsAttention}
            </Text>
          </Inline>
        ) : null}
      </Stack>
    </Surface>
  );
}

/** Client-side estimate for card display only; real totals come from the catalog at use time. */
function estimateKcal(): number {
  return 0;
}

function formatWeekdays(weekdays: number[], locale: string): string {
  if (weekdays.length === 0 || weekdays.length === 7) return "";
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
  headerCopy: {
    flex: 1,
  },
  cardTitle: {
    flex: 1,
  },
});
