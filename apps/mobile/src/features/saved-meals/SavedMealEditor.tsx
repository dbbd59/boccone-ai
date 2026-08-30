import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { Food, FoodPortion, MealCategory } from "@boccone/api-client";
import { calculateNutrition, type NutritionValues } from "@boccone/utils";
import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  Field,
  FloatingGlassBar,
  GlassButton,
  GlassIconButton,
  Inline,
  Input,
  Screen,
  Stack,
  Surface,
  Text,
  useThemeColors,
} from "@boccone/ui-mobile";

import { FoodSearchResult } from "../../components/FoodSearchResult";
import { MealEntryRow } from "../../components/MealEntryRow";
import { MascotAvatar } from "../../components/MascotAvatar";
import { QuantityControl } from "../../components/QuantityControl";
import { useI18n } from "../../i18n/context";
import { searchFoodCatalog } from "../../lib/foods";
import { lightImpactFeedback } from "../../lib/haptics";
import { createSavedMeal, fetchSavedMeal, updateSavedMeal } from "../../lib/saved-meals";

const CATEGORIES: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];

interface TemplateEntry {
  key: string;
  food: Food;
  portionName: string;
  quantity: number;
  grams: number;
}

export function SavedMealEditor({ savedMealId }: { savedMealId?: string } = {}) {
  const { copy, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MealCategory | null>(null);
  const [entries, setEntries] = useState<TemplateEntry[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<FoodPortion | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [customGrams, setCustomGrams] = useState("100");
  const [error, setError] = useState<string | null>(null);

  const existingQuery = useQuery({
    queryKey: ["saved-meal", savedMealId],
    queryFn: () => fetchSavedMeal(savedMealId ?? ""),
    enabled: Boolean(savedMealId),
  });

  useEffect(() => {
    const meal = existingQuery.data;
    if (!meal) return;
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate the editor from the loaded resource. */
    setName(meal.name);
    setCategory(meal.defaultCategory ?? null);
    setEntries(
      meal.items
        .filter((item) => !item.needsAttention && item.foodId)
        .map((item, index) => ({
          key: `tpl-${item.id}-${index}`,
          food: {
            id: item.foodId!,
            name: item.foodName ?? item.foodId!,
            type: "generic",
            category: null,
            brand: null,
            barcode: null,
            nutritionPer100g: emptyNutrition(),
            sourceType: "BOCCONE_CURATED",
            sourceId: null,
            sourceName: null,
            sourceUrl: null,
            qualityLevel: "boccone_verified",
            status: "APPROVED",
            portions: [],
            aliases: [],
            isPrivate: false,
            createdAt: "",
            updatedAt: "",
          },
          portionName: item.portionName,
          quantity: item.quantity,
          grams: item.grams,
        })),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [existingQuery.data]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(timer);
  }, [query]);

  const foodQuery = useQuery({
    queryKey: ["food-catalog", debouncedQuery, locale],
    queryFn: ({ signal }) => searchFoodCatalog(debouncedQuery, locale, signal),
  });

  function selectFood(food: Food) {
    setSelectedFood(food);
    const defaultPortion = food.portions.find((p) => p.isDefault) ?? food.portions[0];
    setSelectedPortion(defaultPortion ?? null);
    setQuantity("1");
    setCustomGrams(String(defaultPortion?.gramWeight ?? 100));
  }

  function addEntry() {
    if (!selectedFood) return;
    const grams = selectedPortion
      ? selectedPortion.gramWeight * (Number(quantity.replace(",", ".")) || 1)
      : Number(customGrams.replace(",", ".")) || 100;
    const entry: TemplateEntry = {
      key: `tpl-${selectedFood.id}-${Date.now()}`,
      food: selectedFood,
      portionName: selectedPortion?.name ?? `${Math.round(grams)} g`,
      quantity: selectedPortion ? Number(quantity.replace(",", ".")) || 1 : 1,
      grams,
    };
    setEntries((current) =>
      editingIndex !== null
        ? current.map((e, i) => (i === editingIndex ? entry : e))
        : [...current, entry],
    );
    setEditingIndex(null);
    setSelectedFood(null);
    setSelectedPortion(null);
    setQuery("");
    lightImpactFeedback();
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        defaultCategory: category ?? undefined,
        items: entries.map((entry) => ({
          foodId: entry.food.id,
          portionName: entry.portionName,
          quantity: entry.quantity,
          grams: entry.grams,
        })),
      };
      return savedMealId ? updateSavedMeal(savedMealId, payload) : createSavedMeal(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["saved-meals"] });
      router.back();
    },
    onError: () => setError(copy.saved.saveError),
  });

  const total = useMemo(
    () =>
      entries.reduce((sum, entry) => {
        const n = nutritionOf(entry.food);
        const scaled = calculateNutrition(n, entry.grams);
        return sum + (scaled.energyKcal ?? 0);
      }, 0),
    [entries],
  );

  if (savedMealId && existingQuery.isPending) {
    return (
      <Screen>
        <Text role="status" tone="secondary">
          {copy.meal.loading}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoid>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Stack gap="xl">
            <Inline align="center" gap="sm">
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
              <MascotAvatar accessibilityLabel={copy.home.mascotTitle} size={40} />
              <Text variant="headingMd">
                {savedMealId ? copy.saved.edit : copy.saved.newSavedMeal}
              </Text>
            </Inline>

            <Surface>
              <Stack gap="md">
                <Field label={copy.saved.nameLabel}>
                  <Input
                    value={name}
                    onChangeText={setName}
                    placeholder={copy.saved.namePlaceholder}
                  />
                </Field>
                <Field label={copy.saved.mealTypeLabel}>
                  <FloatingGlassBar mergeSpacing={spacing[1]} style={styles.categoryBar}>
                    {CATEGORIES.map((item) => (
                      <GlassButton
                        key={item}
                        size="sm"
                        prominence={category === item ? "prominent" : "regular"}
                        onPress={() => setCategory(category === item ? null : item)}
                      >
                        {copy.meal.categories[item]}
                      </GlassButton>
                    ))}
                  </FloatingGlassBar>
                </Field>
              </Stack>
            </Surface>

            {entries.length > 0 ? (
              <Surface>
                <Stack gap="md">
                  <Text variant="headingMd">{copy.food.selectedFoods}</Text>
                  {entries.map((entry, index) => (
                    <MealEntryRow
                      key={entry.key}
                      name={entry.food.name}
                      detail={`${entry.portionName} · ${Math.round(entry.grams)} g`}
                      calories={entry.food.nutritionPer100g.energyKcal === null ? "—" : ""}
                      onEdit={() => {
                        setEditingIndex(index);
                        selectFood(entry.food);
                        setQuantity(String(entry.quantity));
                      }}
                      onRemove={() => {
                        setEntries((current) => current.filter((_, i) => i !== index));
                        lightImpactFeedback();
                      }}
                    />
                  ))}
                  <Text variant="caption" tone="secondary">
                    {copy.saved.kcalApprox(Math.round(total))}
                  </Text>
                </Stack>
              </Surface>
            ) : null}

            {selectedFood ? (
              <Surface>
                <Stack gap="md">
                  <Text variant="headingMd">{selectedFood.name}</Text>
                  <FloatingGlassBar mergeSpacing={spacing[1]} style={styles.categoryBar}>
                    {selectedFood.portions.map((portion) => (
                      <GlassButton
                        key={portion.id}
                        size="sm"
                        prominence={selectedPortion?.id === portion.id ? "prominent" : "regular"}
                        onPress={() => {
                          setSelectedPortion(portion);
                          setQuantity("1");
                        }}
                      >
                        {portion.name}
                      </GlassButton>
                    ))}
                    <GlassButton
                      size="sm"
                      prominence={!selectedPortion ? "prominent" : "regular"}
                      onPress={() => setSelectedPortion(null)}
                    >
                      {copy.food.customGrams}
                    </GlassButton>
                  </FloatingGlassBar>
                  {selectedPortion ? (
                    <QuantityControl
                      decrementLabel={copy.food.decrement}
                      incrementLabel={copy.food.increment}
                      label={copy.food.quantityLabel}
                      onChangeText={setQuantity}
                      onDecrement={() =>
                        setQuantity((q) =>
                          String(Math.max(0.5, (Number(q.replace(",", ".")) || 1) - 0.5)),
                        )
                      }
                      onIncrement={() =>
                        setQuantity((q) => String((Number(q.replace(",", ".")) || 1) + 0.5))
                      }
                      value={quantity}
                    />
                  ) : (
                    <QuantityControl
                      decrementLabel={copy.food.decrement}
                      incrementLabel={copy.food.increment}
                      label={copy.food.gramsLabel}
                      onChangeText={setCustomGrams}
                      onDecrement={() =>
                        setCustomGrams((g) =>
                          String(Math.max(1, (Number(g.replace(",", ".")) || 100) - 10)),
                        )
                      }
                      onIncrement={() =>
                        setCustomGrams((g) => String((Number(g.replace(",", ".")) || 100) + 10))
                      }
                      value={customGrams}
                    />
                  )}
                  <Button fullWidth onPress={addEntry}>
                    {editingIndex === null ? copy.food.addToMeal : copy.food.updateEntry}
                  </Button>
                </Stack>
              </Surface>
            ) : (
              <Surface>
                <Stack gap="md">
                  <Field label={copy.food.searchLabel}>
                    <Input
                      placeholder={copy.food.searchPlaceholder}
                      value={query}
                      onChangeText={setQuery}
                      returnKeyType="search"
                    />
                  </Field>
                  {foodQuery.data?.foods.length ? (
                    <Stack gap="xs">
                      {foodQuery.data.foods.map((food) => (
                        <FoodSearchResult
                          key={food.id}
                          food={food}
                          onSelect={() => selectFood(food)}
                        />
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              </Surface>
            )}

            {error ? <Alert tone="danger" message={error} /> : null}
          </Stack>
        </ScrollView>
        <View style={[styles.footer, { backgroundColor: colors.background.default }]}>
          <Button
            fullWidth
            disabled={!name.trim() || entries.length === 0}
            loading={saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
          >
            {copy.saved.save}
          </Button>
        </View>
      </KeyboardAvoid>
    </Screen>
  );
}

/** Small wrapper to keep the footer pinned above the keyboard. */
function KeyboardAvoid({ children }: { children: React.ReactNode }) {
  return <View style={styles.keyboard}>{children}</View>;
}

function emptyNutrition(): NutritionValues {
  return {
    energyKcal: null,
    proteinG: null,
    carbohydratesG: null,
    fatG: null,
    fiberG: null,
    sugarG: null,
    saturatedFatG: null,
    sodiumMg: null,
  };
}

function nutritionOf(food: Food): NutritionValues {
  return food.nutritionPer100g;
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing[16] },
  categoryBar: { flexWrap: "wrap" },
  footer: {
    padding: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
