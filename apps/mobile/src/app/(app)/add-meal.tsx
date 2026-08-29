import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Alert as NativeAlert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

import { type CreateMealRequest, type MealCategory } from "@boccone/api-client";
import { mealDateSchema } from "@boccone/contracts";
import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  Field,
  FloatingGlassBar,
  GlassButton,
  Input,
  Screen,
  Stack,
  Surface,
  Text,
} from "@boccone/ui-mobile";

import { useI18n } from "../../i18n/context";
import { createMeal, fetchMeal, formatLocalDate, removeMeal, updateMeal } from "../../lib/meals";

const CATEGORIES: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];

interface Draft {
  name: string;
  category: MealCategory;
  date: string;
  calories: string;
  proteinGrams: string;
  carbohydratesGrams: string;
  fatGrams: string;
  notes: string;
}

export default function AddMealScreen() {
  const { copy } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ mealId?: string }>();
  const mealId = typeof params.mealId === "string" ? params.mealId : undefined;
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const mealQuery = useQuery({
    queryKey: ["mobile-meal", mealId],
    queryFn: () => fetchMeal(mealId ?? ""),
    enabled: Boolean(mealId),
  });

  useEffect(() => {
    if (!mealQuery.data) return;
    // Hydrate editor only after remote meal exists; create mode keeps today's default.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(toDraft(mealQuery.data));
  }, [mealQuery.data]);

  const mutation = useMutation({
    mutationFn: (input: CreateMealRequest) =>
      mealId ? updateMeal(mealId, input) : createMeal(input),
    onSuccess: async (meal) => {
      await queryClient.invalidateQueries({ queryKey: ["getDailyMeals"] });
      await queryClient.invalidateQueries({ queryKey: ["mobile-meal", meal.id] });
      router.replace("/(app)/(tabs)");
    },
  });

  function setValue<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setValidationError(null);
    mutation.reset();
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    const input = parseDraft(draft);
    if (!input) {
      setValidationError(copy.meal.validation);
      return;
    }
    setValidationError(null);
    mutation.mutate(input);
  }

  function confirmRemove() {
    if (!mealId) return;
    NativeAlert.alert(copy.meal.deleteTitle, copy.meal.deleteBody, [
      { text: copy.meal.cancel, style: "cancel" },
      {
        text: copy.meal.delete,
        style: "destructive",
        onPress: () => {
          mutation.reset();
          setDeleting(true);
          void removeMeal(mealId)
            .then(async () => {
              await queryClient.invalidateQueries({ queryKey: ["getDailyMeals"] });
              router.replace("/(app)/(tabs)");
            })
            .catch(() => setValidationError(copy.meal.deleteError))
            .finally(() => setDeleting(false));
        },
      },
    ]);
  }

  const disabled = (Boolean(mealId) && mealQuery.isPending) || mutation.isPending || deleting;
  if (mealId && mealQuery.isPending) {
    return (
      <Screen>
        <Text role="status" tone="secondary">
          {copy.meal.loading}
        </Text>
      </Screen>
    );
  }

  if (mealQuery.isError || (mealId && !mealQuery.data)) {
    return (
      <Screen>
        <Alert tone="danger" message={copy.meal.loadError} />
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Stack gap="xl">
            <Link href="/(app)/(tabs)" asChild>
              <GlassButton accessibilityLabel={copy.navigation.home} size="sm">
                {copy.navigation.home}
              </GlassButton>
            </Link>
            <Stack gap="sm">
              <Text variant="caption" tone="brand">
                BOCCONE AI
              </Text>
              <Text variant="display">{mealId ? copy.meal.editTitle : copy.meal.addTitle}</Text>
              <Text variant="bodyLg" tone="secondary">
                {copy.meal.subtitle}
              </Text>
            </Stack>

            <Surface>
              <Stack gap="md">
                <Field label={copy.meal.nameLabel}>
                  <Input
                    accessibilityLabel={copy.meal.nameLabel}
                    editable={!disabled}
                    placeholder={copy.meal.namePlaceholder}
                    returnKeyType="next"
                    value={draft.name}
                    onChangeText={(value) => setValue("name", value)}
                  />
                </Field>

                <Field label={copy.meal.categoryLabel}>
                  <FloatingGlassBar mergeSpacing={spacing[1]} style={styles.categoryBar}>
                    {CATEGORIES.map((category) => (
                      <GlassButton
                        key={category}
                        accessibilityState={{ selected: draft.category === category }}
                        disabled={disabled}
                        onPress={() => setValue("category", category)}
                        prominence={draft.category === category ? "prominent" : "regular"}
                        size="sm"
                        style={styles.categoryButton}
                      >
                        {copy.meal.categories[category]}
                      </GlassButton>
                    ))}
                  </FloatingGlassBar>
                </Field>

                <Field label={copy.meal.dateLabel} description={copy.meal.dateDescription}>
                  <Input
                    accessibilityLabel={copy.meal.dateLabel}
                    editable={!disabled}
                    keyboardType="numbers-and-punctuation"
                    placeholder="YYYY-MM-DD"
                    value={draft.date}
                    onChangeText={(value) => setValue("date", value)}
                  />
                </Field>

                <Stack gap="sm">
                  <Text variant="label">{copy.meal.nutritionTitle}</Text>
                  <Field label={copy.meal.caloriesLabel}>
                    <Input
                      accessibilityLabel={copy.meal.caloriesLabel}
                      editable={!disabled}
                      keyboardType="number-pad"
                      value={draft.calories}
                      onChangeText={(value) => setValue("calories", value)}
                    />
                  </Field>
                  <Field label={copy.meal.proteinLabel}>
                    <Input
                      accessibilityLabel={copy.meal.proteinLabel}
                      editable={!disabled}
                      keyboardType="number-pad"
                      value={draft.proteinGrams}
                      onChangeText={(value) => setValue("proteinGrams", value)}
                    />
                  </Field>
                  <Field label={copy.meal.carbohydratesLabel}>
                    <Input
                      accessibilityLabel={copy.meal.carbohydratesLabel}
                      editable={!disabled}
                      keyboardType="number-pad"
                      value={draft.carbohydratesGrams}
                      onChangeText={(value) => setValue("carbohydratesGrams", value)}
                    />
                  </Field>
                  <Field label={copy.meal.fatLabel}>
                    <Input
                      accessibilityLabel={copy.meal.fatLabel}
                      editable={!disabled}
                      keyboardType="number-pad"
                      value={draft.fatGrams}
                      onChangeText={(value) => setValue("fatGrams", value)}
                    />
                  </Field>
                </Stack>

                <Field label={copy.meal.notesLabel} description={copy.meal.notesDescription}>
                  <Input
                    accessibilityLabel={copy.meal.notesLabel}
                    editable={!disabled}
                    multiline
                    value={draft.notes}
                    onChangeText={(value) => setValue("notes", value)}
                    style={styles.notesInput}
                  />
                </Field>

                {validationError ? <Alert tone="danger" message={validationError} /> : null}
                {mutation.isError ? <Alert tone="danger" message={copy.meal.saveError} /> : null}
                <Button disabled={disabled} fullWidth loading={mutation.isPending} onPress={save}>
                  {mealId ? copy.meal.saveChanges : copy.meal.save}
                </Button>
                {mealId ? (
                  <Button
                    disabled={disabled}
                    fullWidth
                    loading={deleting}
                    variant="destructive"
                    onPress={confirmRemove}
                  >
                    {copy.meal.delete}
                  </Button>
                ) : null}
              </Stack>
            </Surface>
          </Stack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function emptyDraft(): Draft {
  return {
    name: "",
    category: "breakfast",
    date: formatLocalDate(),
    calories: "",
    proteinGrams: "",
    carbohydratesGrams: "",
    fatGrams: "",
    notes: "",
  };
}

function toDraft(meal: {
  name: string;
  category: MealCategory;
  date: string;
  calories: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  fatGrams: number;
  notes?: string | null;
}): Draft {
  return {
    name: meal.name,
    category: meal.category,
    date: meal.date,
    calories: String(meal.calories),
    proteinGrams: String(meal.proteinGrams),
    carbohydratesGrams: String(meal.carbohydratesGrams),
    fatGrams: String(meal.fatGrams),
    notes: meal.notes ?? "",
  };
}

function parseDraft(draft: Draft): CreateMealRequest | null {
  const calories = parseNumber(draft.calories);
  const proteinGrams = parseNumber(draft.proteinGrams);
  const carbohydratesGrams = parseNumber(draft.carbohydratesGrams);
  const fatGrams = parseNumber(draft.fatGrams);
  if (!draft.name.trim() || !mealDateSchema.safeParse(draft.date.trim()).success) return null;
  if (
    calories === null ||
    proteinGrams === null ||
    carbohydratesGrams === null ||
    fatGrams === null
  ) {
    return null;
  }
  return {
    name: draft.name.trim(),
    category: draft.category,
    date: draft.date.trim(),
    calories,
    proteinGrams,
    carbohydratesGrams,
    fatGrams,
    notes: draft.notes.trim() || null,
  };
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing[6] },
  categoryBar: { flexWrap: "wrap" },
  categoryButton: { flexGrow: 1 },
  notesInput: { minHeight: spacing[12] * 2, textAlignVertical: "top" },
});
