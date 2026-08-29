import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet } from "react-native";

import {
  getCurrentUserOptions,
  getDailyMealsOptions,
  getDailyTargetsOptions,
} from "@boccone/api-client";
import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  GlassButton,
  GlassSurface,
  Inline,
  Screen,
  Stack,
  Surface,
  Text,
} from "@boccone/ui-mobile";

import { LanguageSelector } from "../../../components/LanguageSelector";
import { useI18n } from "../../../i18n/context";
import { formatLocalDate } from "../../../lib/meals";
import { useSession } from "../../../session-context";

const MEAL_CATEGORIES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function HomeScreen() {
  const { session } = useSession();
  const { copy } = useI18n();
  const today = formatLocalDate();
  const meQuery = useQuery({ ...getCurrentUserOptions(), enabled: Boolean(session) });
  const mealsQuery = useQuery({
    ...getDailyMealsOptions({ query: { date: today } }),
    enabled: Boolean(session),
  });
  const targetsQuery = useQuery({ ...getDailyTargetsOptions(), enabled: Boolean(session) });
  const user = meQuery.data?.user ?? session?.user;
  const userName = user?.name?.trim();
  const displayName = userName?.length ? userName : copy.home.fallbackName;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Inline align="start" justify="between">
            <Stack gap="sm" style={styles.greeting}>
              <Text variant="caption" tone="brand">
                BOCCONE AI
              </Text>
              <Text variant="display">{copy.home.greeting(displayName)}</Text>
              <Text variant="bodyLg" tone="secondary">
                {copy.home.subtitle}
              </Text>
            </Stack>
            <LanguageSelector />
          </Inline>

          <Inline align="end" justify="between">
            <Stack gap="xs">
              <Text variant="headingLg">{copy.home.todayTitle}</Text>
              <Text variant="bodySm" tone="secondary">
                {copy.home.todayDate(today)}
              </Text>
            </Stack>
            <Link href="/(app)/add-meal" asChild>
              <Button size="sm">{copy.home.addMeal}</Button>
            </Link>
          </Inline>

          {mealsQuery.isPending ? (
            <Text role="status" tone="secondary">
              {copy.loading.tagline}
            </Text>
          ) : null}
          {mealsQuery.isError || meQuery.isError || targetsQuery.isError ? (
            <Alert tone="danger" message={copy.home.loadError} />
          ) : null}

          {mealsQuery.data ? (
            <>
              <GlassSurface variant="regular" style={styles.summary}>
                <Stack gap="md">
                  <Stack gap="xs">
                    <Text variant="caption" tone="secondary">
                      {copy.home.caloriesLabel}
                    </Text>
                    <Text variant="display">
                      {copy.home.caloriesValue(mealsQuery.data.totals.calories)}
                    </Text>
                    <Text variant="bodySm" tone="secondary">
                      {targetsQuery.data?.targets.calories
                        ? copy.home.caloriesTarget(targetsQuery.data.targets.calories)
                        : copy.home.caloriesUnset}
                    </Text>
                  </Stack>
                  <Stack gap="sm">
                    <Text variant="label">{copy.home.macrosTitle}</Text>
                    <Inline justify="between" gap="sm">
                      <MacroValue
                        label={copy.home.proteinLabel}
                        value={mealsQuery.data.totals.proteinGrams}
                        target={targetsQuery.data?.targets.proteinGrams}
                      />
                      <MacroValue
                        label={copy.home.carbohydratesLabel}
                        value={mealsQuery.data.totals.carbohydratesGrams}
                        target={targetsQuery.data?.targets.carbohydratesGrams}
                      />
                      <MacroValue
                        label={copy.home.fatLabel}
                        value={mealsQuery.data.totals.fatGrams}
                        target={targetsQuery.data?.targets.fatGrams}
                      />
                    </Inline>
                  </Stack>
                </Stack>
              </GlassSurface>

              <Stack gap="md">
                <Text variant="headingMd">{copy.home.mealsTitle}</Text>
                {mealsQuery.data.meals.length === 0 ? (
                  <Surface>
                    <Stack gap="xs">
                      <Text variant="headingSm">{copy.home.emptyTitle}</Text>
                      <Text tone="secondary">{copy.home.emptyBody}</Text>
                    </Stack>
                  </Surface>
                ) : (
                  MEAL_CATEGORIES.map((category) => {
                    const categoryMeals = mealsQuery.data.meals.filter(
                      (meal) => meal.category === category,
                    );
                    if (categoryMeals.length === 0) return null;
                    return (
                      <Stack key={category} gap="xs">
                        <Text variant="label" tone="secondary">
                          {copy.home.categoryLabels[category]}
                        </Text>
                        {categoryMeals.map((meal) => (
                          <Link
                            key={meal.id}
                            href={{ pathname: "/(app)/add-meal", params: { mealId: meal.id } }}
                            asChild
                          >
                            <GlassButton fullWidth accessibilityLabel={copy.home.editMeal}>
                              {copy.home.mealSummary(meal.name, meal.calories)}
                            </GlassButton>
                          </Link>
                        ))}
                      </Stack>
                    );
                  })
                )}
              </Stack>
            </>
          ) : null}

          <GlassSurface variant="regular" style={styles.accountPeek}>
            <Inline align="center" justify="between" gap="md">
              <Stack gap="xs" style={styles.accountCopy}>
                <Text variant="label">{copy.home.mascotTitle}</Text>
                <Text variant="bodySm" tone="secondary">
                  {copy.home.signedInAs(user?.email)}
                </Text>
              </Stack>
              <Link href="/(app)/(tabs)/settings" asChild>
                <GlassButton size="sm" accessibilityLabel={copy.navigation.settings}>
                  {copy.navigation.settings}
                </GlassButton>
              </Link>
            </Inline>
          </GlassSurface>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing[6],
  },
  accountPeek: {
    padding: spacing[4],
  },
  accountCopy: {
    flex: 1,
  },
  summary: {
    padding: spacing[5],
  },
  macroValue: {
    flex: 1,
  },
});

function MacroValue({
  label,
  value,
  target,
}: {
  label: string;
  value: number;
  target: number | null | undefined;
}) {
  const { copy } = useI18n();
  return (
    <Stack gap="xs" style={styles.macroValue}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="headingSm">
        {target === null || target === undefined
          ? copy.home.gramsValue(value)
          : copy.home.gramsTarget(value, target)}
      </Text>
    </Stack>
  );
}
