import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from "react-native";

import {
  getDailyTargetsOptions,
  getMealDiaryInfiniteOptions,
  type DailyMealsResponse,
  type Meal,
} from "@boccone/api-client";
import { borderWidths, minTouchTarget, opacities, spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  GlassButton,
  GlassIconButton,
  Inline,
  Screen,
  Stack,
  Text,
  useThemeColors,
} from "@boccone/ui-mobile";

import { EmptyState } from "../../components/EmptyState";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { MascotAvatar } from "../../components/MascotAvatar";
import { NutritionSummary } from "../../components/NutritionSummary";
import { useI18n } from "../../i18n/context";
import {
  addCalendarDays,
  formatLocalDate,
  formatReadableDate,
  parseLocalDate,
} from "../../lib/dates";
import { formatKcal, formatMealTime } from "../../lib/format";
import { useSession } from "../../session-context";

export function DiaryScreen() {
  const { session } = useSession();
  const { locale } = useI18n();
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; foodId?: string; foodName?: string }>();
  const foodId = typeof params.foodId === "string" ? params.foodId : undefined;
  const foodName = typeof params.foodName === "string" ? params.foodName : undefined;
  const today = formatLocalDate();
  const focusDate = resolveFocusDate(params.date, today);
  const initialBefore = formatLocalDate(addCalendarDays(parseLocalDate(focusDate), 1));
  const targetsQuery = useQuery({ ...getDailyTargetsOptions(), enabled: Boolean(session) });
  const diaryQuery = useInfiniteQuery({
    ...getMealDiaryInfiniteOptions({
      query: { before: initialBefore, limit: 7, ...(foodId ? { foodId } : {}) },
    }),
    enabled: Boolean(session),
    initialPageParam: initialBefore,
    getNextPageParam: (lastPage) => lastPage.nextBefore ?? undefined,
  });
  const loadedDays = diaryQuery.data?.pages.flatMap((page) => page.days) ?? [];
  const visibleDays = withFocusDay(loadedDays, focusDate);
  const hasMeals = loadedDays.some((day) => day.meals.length > 0);
  const isToday = focusDate === today;
  const showEmptyHistory = Boolean(diaryQuery.data && !hasMeals && visibleDays.length === 1);
  const diaryDays = showEmptyHistory || !diaryQuery.data ? [] : visibleDays;
  const headerStatus = diaryQuery.isPending
    ? "loading"
    : diaryQuery.isError
      ? "error"
      : showEmptyHistory
        ? "empty"
        : "ready";
  const renderDayItem = useCallback<ListRenderItem<DailyMealsResponse>>(
    ({ item, index }) => (
      <View style={index < diaryDays.length - 1 ? styles.dayItem : undefined}>
        <DiaryDaySection
          day={item}
          isCurrent={item.date === focusDate}
          isFirst={index === 0}
          locale={locale}
          target={item.date === today ? targetsQuery.data?.targets.calories : undefined}
          onAddMeal={() => router.push({ pathname: "/meals/new", params: { date: item.date } })}
          onOpenMeal={(meal) =>
            router.push({ pathname: "/meals/[mealId]", params: { mealId: meal.id } })
          }
        />
      </View>
    ),
    [diaryDays.length, focusDate, locale, router, targetsQuery.data?.targets.calories, today],
  );

  function moveDay(amount: number) {
    const nextDate = formatLocalDate(addCalendarDays(parseLocalDate(focusDate), amount));
    if (nextDate > today) return;
    router.replace({
      pathname: "/diary",
      params: { date: nextDate, ...(foodId ? { foodId, foodName } : {}) },
    });
  }

  return (
    <Screen>
      <FlatList
        data={diaryDays}
        initialNumToRender={7}
        keyExtractor={(day) => day.date}
        ListFooterComponent={
          <DiaryListFooter
            hasMeals={hasMeals}
            hasNextPage={diaryQuery.hasNextPage}
            isFetchingNextPage={diaryQuery.isFetchingNextPage}
            onLoadMore={() => void diaryQuery.fetchNextPage()}
          />
        }
        ListHeaderComponent={
          <DiaryListHeader
            dateMode={isToday ? "today" : "past"}
            focusDate={focusDate}
            status={headerStatus}
            onAddMeal={() => router.push({ pathname: "/meals/new", params: { date: focusDate } })}
            onOpenCalendar={() =>
              router.push({ pathname: "/calendar", params: { date: focusDate } })
            }
            onRetry={() => void diaryQuery.refetch()}
            onSetToday={() => router.replace("/diary")}
            onMoveDay={moveDay}
            foodFilter={foodName}
            onClearFoodFilter={() => router.replace("/diary")}
          />
        }
        ListEmptyComponent={null}
        maxToRenderPerBatch={7}
        removeClippedSubviews
        renderItem={renderDayItem}
        refreshControl={
          <RefreshControl
            refreshing={diaryQuery.isRefetching || targetsQuery.isRefetching}
            onRefresh={() => void Promise.all([diaryQuery.refetch(), targetsQuery.refetch()])}
            tintColor={colors.interactive.default}
          />
        }
        windowSize={5}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function DiaryListHeader({
  dateMode,
  focusDate,
  status,
  onAddMeal,
  onMoveDay,
  onOpenCalendar,
  onRetry,
  onSetToday,
  foodFilter,
  onClearFoodFilter,
}: {
  dateMode: "past" | "today";
  focusDate: string;
  status: "empty" | "error" | "loading" | "ready";
  onAddMeal: () => void;
  onMoveDay: (amount: number) => void;
  onOpenCalendar: () => void;
  onRetry: () => void;
  onSetToday: () => void;
  foodFilter?: string;
  onClearFoodFilter: () => void;
}) {
  const { copy, locale } = useI18n();
  const colors = useThemeColors();
  const today = formatLocalDate();
  const isEmptyHistory = status === "empty";
  const isError = status === "error";
  const isPending = status === "loading";
  const isToday = dateMode === "today";
  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Text variant="title">{copy.diary.title}</Text>
        <Text variant="bodySm" tone="secondary">
          {copy.diary.subtitle}
        </Text>
      </Stack>

      {foodFilter ? (
        <Inline align="center" justify="between" gap="sm">
          <Text numberOfLines={2} tone="secondary" variant="bodySm">
            {copy.diary.foodFilter(foodFilter)}
          </Text>
          <Button size="sm" variant="ghost" onPress={onClearFoodFilter}>
            {copy.diary.clearFoodFilter}
          </Button>
        </Inline>
      ) : null}

      <Stack gap="md">
        <Inline align="center" justify="between" gap="sm">
          <GlassIconButton
            accessibilityLabel={copy.diary.previousDay}
            icon={
              <MaterialCommunityIcons
                color={colors.foreground.default}
                name="chevron-left"
                size={22}
              />
            }
            onPress={() => onMoveDay(-1)}
          />
          <Stack align="center" gap="xs" style={styles.dateCopy}>
            <Text variant="headingMd">{formatDayLabel(focusDate, today, locale, copy)}</Text>
            {!isToday ? (
              <Text variant="caption" tone="secondary">
                {formatReadableDate(focusDate, locale)}
              </Text>
            ) : null}
          </Stack>
          <GlassIconButton
            accessibilityLabel={copy.diary.nextDay}
            disabled={isToday}
            icon={
              <MaterialCommunityIcons
                color={isToday ? colors.foreground.subtle : colors.foreground.default}
                name="chevron-right"
                size={22}
              />
            }
            onPress={() => onMoveDay(1)}
          />
        </Inline>
        <Inline gap="sm" justify="center" wrap>
          {!isToday ? (
            <Button size="sm" variant="ghost" onPress={onSetToday}>
              {copy.diary.today}
            </Button>
          ) : null}
          <GlassButton size="sm" onPress={onOpenCalendar}>
            {copy.diary.openCalendar}
          </GlassButton>
          <GlassButton size="sm" prominence="prominent" onPress={onAddMeal}>
            {copy.diary.addMeal}
          </GlassButton>
        </Inline>
      </Stack>

      {isPending ? <LoadingSkeleton label={copy.diary.loading} /> : null}
      {isError ? (
        <Stack gap="sm">
          <Alert tone="danger" message={copy.diary.loadError} />
          <Button variant="ghost" size="sm" onPress={onRetry}>
            {copy.diary.retry}
          </Button>
        </Stack>
      ) : null}

      {isEmptyHistory ? (
        <EmptyState
          actionLabel={copy.diary.addMeal}
          body={copy.diary.emptyBody}
          illustration={<MascotAvatar accessibilityLabel={copy.home.mascotTitle} size={72} />}
          onAction={onAddMeal}
          title={copy.diary.emptyTitle}
        />
      ) : null}
    </Stack>
  );
}

function DiaryListFooter({
  hasMeals,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasMeals: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  const { copy } = useI18n();
  if (hasNextPage) {
    return (
      <Button fullWidth loading={isFetchingNextPage} variant="secondary" onPress={onLoadMore}>
        {copy.diary.loadMore}
      </Button>
    );
  }
  return hasMeals ? (
    <Text variant="caption" tone="secondary" style={styles.endOfHistory}>
      {copy.diary.endOfHistory}
    </Text>
  ) : null;
}

function DiaryDaySection({
  day,
  isCurrent,
  isFirst,
  locale,
  target,
  onAddMeal,
  onOpenMeal,
}: {
  day: DailyMealsResponse;
  isCurrent: boolean;
  isFirst: boolean;
  locale: "en" | "it";
  target?: number | null;
  onAddMeal: () => void;
  onOpenMeal: (meal: Meal) => void;
}) {
  const { copy } = useI18n();
  const colors = useThemeColors();
  return (
    <Stack gap="md">
      <Inline align="end" justify="between" gap="md">
        <Stack gap="xs" style={styles.dayHeading}>
          <Text variant={isCurrent && isFirst ? "headingXl" : "headingLg"}>
            {formatDayLabel(day.date, formatLocalDate(), locale, copy)}
          </Text>
          {!isCurrent || !isFirst ? (
            <Text variant="caption" tone="secondary">
              {formatReadableDate(day.date, locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          ) : null}
        </Stack>
        {day.meals.length > 0 ? (
          <Text variant="caption" tone="secondary">
            {copy.diary.dayTotal} · {formatKcal(day.totals.calories, locale)}
          </Text>
        ) : null}
      </Inline>

      {day.meals.length > 0 ? (
        <>
          <NutritionSummary
            calories={day.totals.calories}
            carbohydrates={day.totals.carbohydratesGrams}
            compact={!isCurrent}
            fat={day.totals.fatGrams}
            incomplete={day.nutritionIncomplete}
            protein={day.totals.proteinGrams}
            target={target}
            showTarget={isCurrent}
          />
          <Stack gap="lg">
            {groupMealsByCategory(day.meals).map((group) => (
              <Stack key={group.category} gap="xs">
                <Text variant="label" tone="secondary">
                  {copy.meal.categories[group.category]}
                </Text>
                <Stack>
                  {group.meals.map((meal, index) => (
                    <DiaryMealRow
                      key={meal.id}
                      meal={meal}
                      locale={locale}
                      onPress={() => onOpenMeal(meal)}
                      border={
                        index < group.meals.length - 1
                          ? colors.border.subtle
                          : colors.background.default
                      }
                    />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </>
      ) : (
        <Stack gap="sm">
          <Text variant="bodySm" tone="secondary">
            {copy.diary.emptyBody}
          </Text>
          <Button size="sm" variant="ghost" onPress={onAddMeal}>
            {copy.diary.addMeal}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}

function DiaryMealRow({
  meal,
  locale,
  onPress,
  border,
}: {
  meal: Meal;
  locale: "en" | "it";
  onPress: () => void;
  border: string;
}) {
  const { copy } = useI18n();
  const colors = useThemeColors();
  const foods = meal.entries.map((entry) => entry.foodName).join(" · ");
  const time = formatMealTime(meal.createdAt, locale);
  return (
    <Pressable
      accessibilityLabel={copy.diary.openMeal(meal.name)}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.mealRow,
        { borderBottomColor: border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.mealMarker, { backgroundColor: colors.interactive.default }]} />
      <Stack gap="xs" style={styles.mealCopy}>
        <Inline align="center" justify="end" gap="sm">
          {time ? (
            <Text variant="caption" tone="secondary">
              {time}
            </Text>
          ) : null}
        </Inline>
        <Text variant="headingSm" numberOfLines={2}>
          {meal.name}
        </Text>
        {foods ? (
          <Text variant="bodySm" tone="secondary" numberOfLines={3}>
            {foods}
          </Text>
        ) : null}
      </Stack>
      <Stack align="end" gap="xs">
        <Text variant="label" tone="brand">
          {formatKcal(meal.calories, locale)}
        </Text>
        <MaterialCommunityIcons
          accessibilityElementsHidden
          color={colors.foreground.subtle}
          name="chevron-right"
          size={20}
        />
      </Stack>
    </Pressable>
  );
}

function groupMealsByCategory(meals: Meal[]) {
  const categories: Meal["category"][] = ["breakfast", "lunch", "dinner", "snack"];
  return categories
    .map((category) => ({
      category,
      meals: meals.filter((meal) => meal.category === category),
    }))
    .filter((group) => group.meals.length > 0);
}

function resolveFocusDate(value: string | string[] | undefined, fallback: string): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return fallback;
  const parsed = parseLocalDate(candidate);
  return Number.isNaN(parsed.getTime()) ||
    formatLocalDate(parsed) !== candidate ||
    candidate > fallback
    ? fallback
    : candidate;
}

function withFocusDay(days: DailyMealsResponse[], focusDate: string): DailyMealsResponse[] {
  if (days.some((day) => day.date === focusDate)) return days;
  return [
    {
      date: focusDate,
      meals: [],
      totals: { calories: 0, proteinGrams: 0, carbohydratesGrams: 0, fatGrams: 0 },
      nutritionIncomplete: false,
    },
    ...days,
  ];
}

function formatDayLabel(
  date: string,
  today: string,
  locale: "en" | "it",
  copy: ReturnType<typeof useI18n>["copy"],
): string {
  if (date === today) return copy.diary.today;
  if (date === formatLocalDate(addCalendarDays(parseLocalDate(today), -1))) {
    return copy.diary.yesterday;
  }
  return formatReadableDate(date, locale, { weekday: "long", month: "long", day: "numeric" });
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  dateCopy: {
    flex: 1,
  },
  dayItem: {
    paddingBottom: spacing[8],
  },
  dayHeading: {
    flex: 1,
  },
  endOfHistory: {
    textAlign: "center",
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    minHeight: minTouchTarget,
    borderBottomWidth: borderWidths.hairline,
    paddingVertical: spacing[4],
  },
  mealMarker: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: spacing[2],
  },
  mealCopy: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: opacities.pressed,
  },
});
