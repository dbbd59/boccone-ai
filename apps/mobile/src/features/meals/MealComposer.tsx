import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import type {
  Food,
  FoodType,
  FoodPortion,
  MealFoodEntry,
  MealFoodEntryInput,
  MealCategory,
} from "@boccone/api-client";
import { calculateNutrition, type NutritionValues } from "@boccone/utils";
import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  Field,
  FloatingGlassBar,
  GlassButton,
  Inline,
  Input,
  Screen,
  Stack,
  Surface,
  Text,
} from "@boccone/ui-mobile";

import { useI18n } from "../../i18n/context";
import { formatLocalDate } from "../../lib/dates";
import { searchFoodCatalog, submitFood } from "../../lib/foods";
import { createMeal, fetchMeal, updateMeal } from "../../lib/meals";

const CATEGORIES: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];

interface DraftEntry {
  food: Food;
  portionName: string;
  quantity: number;
  grams: number;
}

interface ProposalDraft {
  name: string;
  brand: string;
  type: FoodType;
  category: string;
  portionName: string;
  portionGrams: string;
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
}

export function MealComposer({ mealId }: { mealId?: string } = {}) {
  const { copy, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<MealCategory>(() => categoryForCurrentTime());
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<FoodPortion | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [customGrams, setCustomGrams] = useState("100");
  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState<ProposalDraft>(emptyProposal());
  const [error, setError] = useState<string | null>(null);

  const mealQuery = useQuery({
    queryKey: ["mobile-meal", mealId],
    queryFn: () => fetchMeal(mealId ?? ""),
    enabled: Boolean(mealId),
  });

  useEffect(() => {
    if (!mealQuery.data) return;
    // Hydrate food entries from immutable meal snapshots. Saving resolves the
    // original food IDs again, preserving the existing catalog contract.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategory(mealQuery.data.category);
    setEntries((mealQuery.data.entries ?? []).map(toDraftEntry));
  }, [mealQuery.data]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(timer);
  }, [query]);

  const foodQuery = useQuery({
    queryKey: ["food-catalog", debouncedQuery, locale],
    queryFn: ({ signal }) => searchFoodCatalog(debouncedQuery, locale, signal),
  });
  const similarSearchTerm = useMemo(
    () => debouncedQuery.trim().split(/\s+/u)[0] ?? "",
    [debouncedQuery],
  );
  const similarFoodQuery = useQuery({
    queryKey: ["food-catalog-similar", similarSearchTerm, locale],
    queryFn: ({ signal }) => searchFoodCatalog(similarSearchTerm, locale, signal),
    enabled:
      debouncedQuery === query &&
      debouncedQuery.trim().split(/\s+/u).length > 1 &&
      !foodQuery.isPending &&
      foodQuery.data?.foods.length === 0,
  });

  const selectedPreview = useMemo(() => {
    if (!selectedFood) return null;
    const grams = selectedPortion
      ? selectedPortion.gramWeight * positiveNumber(quantity, 1)
      : positiveNumber(customGrams, 100);
    return { grams, nutrition: calculateNutrition(toNutrition(selectedFood), grams) };
  }, [customGrams, quantity, selectedFood, selectedPortion]);

  const total = useMemo(
    () =>
      entries.reduce(
        (sum, entry) => addNutrition(sum, calculateNutrition(toNutrition(entry.food), entry.grams)),
        emptyNutrition(),
      ),
    [entries],
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        name: mealQuery.data?.name ?? copy.meal.categories[category],
        category,
        date: mealQuery.data?.date ?? formatLocalDate(),
        entries: entries.map<MealFoodEntryInput>((entry) => ({
          foodId: entry.food.id,
          portionName: entry.portionName,
          quantity: entry.quantity,
          grams: entry.grams,
        })),
      };
      return mealId ? updateMeal(mealId, input) : createMeal(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["getDailyMeals"] });
      if (mealId) {
        await queryClient.invalidateQueries({ queryKey: ["mobile-meal", mealId] });
        router.back();
      } else {
        router.replace("/meals");
      }
    },
    onError: () => setError(copy.food.error),
  });

  const proposalMutation = useMutation({
    mutationFn: () => {
      const portionGrams = positiveNumber(proposal.portionGrams, 0);
      const calories = nullableNumber(proposal.calories);
      const protein = nullableNumber(proposal.protein);
      const carbohydrates = nullableNumber(proposal.carbohydrates);
      const fat = nullableNumber(proposal.fat);
      if (
        !proposal.name.trim() ||
        portionGrams <= 0 ||
        calories === null ||
        protein === null ||
        carbohydrates === null ||
        fat === null
      ) {
        throw new Error(copy.food.validation);
      }
      return submitFood({
        name: proposal.name.trim(),
        brand: proposal.brand.trim() || null,
        type: proposal.type,
        category: proposal.category.trim() || null,
        portionName: proposal.portionName.trim() || "1 serving",
        portionGrams,
        nutritionPer100g: {
          energyKcal: calories,
          proteinG: protein,
          carbohydratesG: carbohydrates,
          fatG: fat,
          fiberG: null,
          sugarG: null,
          saturatedFatG: null,
          sodiumMg: null,
        },
      });
    },
    onSuccess: (food) => {
      setShowProposal(false);
      setProposal(emptyProposal());
      selectFood(food);
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : copy.food.validation),
  });

  function selectFood(food: Food) {
    setError(null);
    setSelectedFood(food);
    const defaultPortion = food.portions.find((portion) => portion.isDefault) ?? food.portions[0];
    setSelectedPortion(defaultPortion ?? null);
    setQuantity("1");
    setCustomGrams(String(defaultPortion?.gramWeight ?? 100));
  }

  function editEntry(index: number) {
    const entry = entries[index];
    if (!entry) return;
    setEditingIndex(index);
    selectFood(entry.food);
    const portion = entry.food.portions.find((item) => item.name === entry.portionName);
    setSelectedPortion(portion ?? null);
    setQuantity(String(entry.quantity));
    setCustomGrams(String(entry.grams));
  }

  function addSelectedFood() {
    if (!selectedFood || !selectedPreview || selectedPreview.grams <= 0) return;
    const nextEntry = {
      food: selectedFood,
      portionName: selectedPortion?.name ?? `${selectedPreview.grams} g`,
      quantity: selectedPortion ? positiveNumber(quantity, 1) : 1,
      grams: selectedPreview.grams,
    };
    setEntries((current) =>
      editingIndex === null
        ? [...current, nextEntry]
        : current.map((entry, index) => (index === editingIndex ? nextEntry : entry)),
    );
    setEditingIndex(null);
    setSelectedFood(null);
    setSelectedPortion(null);
    setQuery("");
  }

  if (mealId && mealQuery.isPending) {
    return (
      <Screen>
        <Text role="status" tone="secondary">
          {copy.meal.loading}
        </Text>
      </Screen>
    );
  }

  if (mealId && (mealQuery.isError || !mealQuery.data)) {
    return (
      <Screen>
        <Stack gap="md">
          <GlassButton onPress={() => router.back()}>{copy.navigation.back}</GlassButton>
          <Alert tone="danger" message={copy.meal.loadError} />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Stack gap="xl">
            <GlassButton onPress={() => router.back()}>{copy.navigation.back}</GlassButton>
            <Stack gap="sm">
              <Text variant="caption" tone="brand">
                BOCCONE AI
              </Text>
              <Text variant="display">{mealId ? copy.meal.editTitle : copy.food.title}</Text>
              <Text variant="bodyLg" tone="secondary">
                {copy.food.searchHint}
              </Text>
            </Stack>

            <FloatingGlassBar mergeSpacing={spacing[2]} style={styles.categoryBar}>
              {CATEGORIES.map((item) => (
                <GlassButton
                  key={item}
                  accessibilityState={{ selected: item === category }}
                  onPress={() => setCategory(item)}
                  prominence={item === category ? "prominent" : "regular"}
                  size="sm"
                  style={styles.categoryButton}
                >
                  {copy.meal.categories[item]}
                </GlassButton>
              ))}
            </FloatingGlassBar>

            {entries.length > 0 ? (
              <Surface>
                <Stack gap="md">
                  <Text variant="headingMd">{copy.food.selectedFoods}</Text>
                  {entries.map((entry, index) => (
                    <View key={`${entry.food.id}-${index}`} style={styles.entryRow}>
                      <View style={styles.entryCopy}>
                        <Text variant="label">{entry.food.name}</Text>
                        <Text variant="bodySm" tone="secondary">
                          {entry.portionName} · {formatNumber(entry.grams)} g
                        </Text>
                      </View>
                      <View style={styles.entryAction}>
                        <Text variant="label">
                          {formatKcal(
                            calculateNutrition(toNutrition(entry.food), entry.grams).energyKcal,
                          )}
                        </Text>
                        <Button size="sm" variant="ghost" onPress={() => editEntry(index)}>
                          {copy.food.editEntry}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() =>
                            setEntries((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                        >
                          {copy.food.remove}
                        </Button>
                      </View>
                    </View>
                  ))}
                </Stack>
              </Surface>
            ) : null}

            {!selectedFood ? (
              <Surface>
                <Stack gap="md">
                  <Field label={copy.food.searchPlaceholder}>
                    <Input autoFocus value={query} onChangeText={setQuery} returnKeyType="search" />
                  </Field>
                  {foodQuery.isPending ? (
                    <Text role="status" tone="secondary">
                      {copy.food.loading}
                    </Text>
                  ) : null}
                  {foodQuery.isError ? <Alert tone="danger" message={copy.food.error} /> : null}
                  {!query.trim() && foodQuery.data?.recent.length ? (
                    <FoodSection
                      title={copy.food.recent}
                      foods={foodQuery.data.recent}
                      onSelect={selectFood}
                    />
                  ) : null}
                  {!query.trim() && foodQuery.data?.frequent.length ? (
                    <FoodSection
                      title={copy.food.frequent}
                      foods={foodQuery.data.frequent}
                      onSelect={selectFood}
                    />
                  ) : null}
                  {!query.trim() && foodQuery.data?.foods.length ? (
                    <FoodSection
                      title={copy.food.suggestions}
                      foods={foodQuery.data.foods}
                      onSelect={selectFood}
                    />
                  ) : null}
                  {query.trim() && debouncedQuery === query && foodQuery.data?.foods.length ? (
                    <FoodSection
                      title={copy.food.results}
                      foods={foodQuery.data.foods}
                      onSelect={selectFood}
                    />
                  ) : null}
                  {query.trim() &&
                  debouncedQuery === query &&
                  !foodQuery.isPending &&
                  foodQuery.data?.foods.length === 0 ? (
                    <Stack gap="sm">
                      <Text variant="bodySm" tone="secondary">
                        {copy.food.noResults}
                      </Text>
                      {similarFoodQuery.isPending ? (
                        <Text variant="bodySm" tone="secondary">
                          {copy.food.loading}
                        </Text>
                      ) : null}
                      {similarFoodQuery.data?.foods.length ? (
                        <FoodSection
                          title={copy.food.possibleMatches}
                          foods={similarFoodQuery.data.foods}
                          onSelect={selectFood}
                        />
                      ) : null}
                      <Button
                        variant="secondary"
                        onPress={() => {
                          setProposal((current) => ({ ...current, name: query.trim() }));
                          setShowProposal(true);
                        }}
                      >
                        {copy.food.propose(query.trim())}
                      </Button>
                    </Stack>
                  ) : null}
                  {showProposal ? (
                    <ProposalForm
                      draft={proposal}
                      setDraft={setProposal}
                      onCancel={() => setShowProposal(false)}
                      onSubmit={() => proposalMutation.mutate()}
                      loading={proposalMutation.isPending}
                    />
                  ) : null}
                </Stack>
              </Surface>
            ) : (
              <Surface>
                <Stack gap="md">
                  <InlineHeader
                    title={selectedFood.name}
                    onBack={() => {
                      setEditingIndex(null);
                      setSelectedFood(null);
                    }}
                    backLabel={copy.food.cancel}
                  />
                  <Text variant="bodySm" tone="secondary">
                    {copy.food.portionTitle}
                  </Text>
                  <FloatingGlassBar mergeSpacing={spacing[1]} style={styles.portionsBar}>
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
                      onPress={() => {
                        setSelectedPortion(null);
                        setQuantity("1");
                      }}
                    >
                      {copy.food.customGrams}
                    </GlassButton>
                  </FloatingGlassBar>
                  {selectedPortion ? (
                    <Field label={copy.food.quantityLabel}>
                      <Input
                        keyboardType="decimal-pad"
                        value={quantity}
                        onChangeText={setQuantity}
                      />
                    </Field>
                  ) : (
                    <Field label={copy.food.gramsLabel}>
                      <Input
                        keyboardType="decimal-pad"
                        value={customGrams}
                        onChangeText={setCustomGrams}
                      />
                    </Field>
                  )}
                  {selectedPreview ? (
                    <NutritionPreview
                      grams={selectedPreview.grams}
                      nutrition={selectedPreview.nutrition}
                      approximate={copy.food.approximate}
                    />
                  ) : null}
                  {selectedPortion ? (
                    <FloatingGlassBar mergeSpacing={spacing[1]} style={styles.quantityBar}>
                      {[0.5, 1, 2].map((value) => (
                        <GlassButton
                          key={value}
                          size="sm"
                          prominence={
                            positiveNumber(quantity, 1) === value ? "prominent" : "regular"
                          }
                          onPress={() => setQuantity(String(value))}
                        >
                          {`${value}×`}
                        </GlassButton>
                      ))}
                    </FloatingGlassBar>
                  ) : null}
                  <Button fullWidth onPress={addSelectedFood}>
                    {editingIndex === null ? copy.food.addToMeal : copy.food.updateEntry}
                  </Button>
                </Stack>
              </Surface>
            )}

            <Surface elevation="none" style={styles.totalSurface}>
              <InlineHeader title={copy.food.mealTotal} />
              <Text variant="numeric">{formatKcal(total.energyKcal)}</Text>
              <Inline gap="md" align="start">
                <Macro label={copy.home.proteinLabel} value={total.proteinG} />
                <Macro label={copy.home.carbohydratesLabel} value={total.carbohydratesG} />
                <Macro label={copy.home.fatLabel} value={total.fatG} />
              </Inline>
            </Surface>
            <Button
              fullWidth
              disabled={entries.length === 0}
              loading={saveMutation.isPending}
              onPress={() => saveMutation.mutate()}
            >
              {mealId ? copy.meal.saveChanges : copy.food.saveMeal}
            </Button>
            {error ? <Alert tone="danger" message={error} /> : null}
          </Stack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function FoodSection({
  title,
  foods,
  onSelect,
}: {
  title: string;
  foods: Food[];
  onSelect: (food: Food) => void;
}) {
  return (
    <Stack gap="xs">
      <Text variant="label" tone="secondary">
        {title}
      </Text>
      {foods.map((food) => {
        const portion = food.portions.find((item) => item.isDefault) ?? food.portions[0];
        const portionKcal = portion
          ? calculateNutrition(toNutrition(food), portion.gramWeight).energyKcal
          : null;
        return (
          <GlassButton
            key={food.id}
            fullWidth
            onPress={() => onSelect(food)}
          >{`${food.name} · ${formatKcal(food.nutritionPer100g.energyKcal)} / 100 g${portion ? ` · ${portion.name} ${formatKcal(portionKcal)}` : ""}`}</GlassButton>
        );
      })}
    </Stack>
  );
}

function ProposalForm({
  draft,
  setDraft,
  onCancel,
  onSubmit,
  loading,
}: {
  draft: ProposalDraft;
  setDraft: Dispatch<SetStateAction<ProposalDraft>>;
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const { copy } = useI18n();
  const update = (key: keyof ProposalDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <Surface elevation="none">
      <Stack gap="sm">
        <Text variant="headingSm">{copy.food.notFoundTitle}</Text>
        <Field label={copy.food.nameLabel}>
          <Input value={draft.name} onChangeText={(value) => update("name", value)} />
        </Field>
        <Field label={copy.food.brandLabel}>
          <Input
            placeholder={copy.food.brandPlaceholder}
            value={draft.brand}
            onChangeText={(value) => update("brand", value)}
          />
        </Field>
        <Field label={copy.food.typeLabel}>
          <FloatingGlassBar mergeSpacing={spacing[1]} style={styles.proposalTypeBar}>
            {(["generic", "branded", "dish"] as FoodType[]).map((type) => (
              <GlassButton
                key={type}
                size="sm"
                prominence={draft.type === type ? "prominent" : "regular"}
                onPress={() => update("type", type)}
              >
                {copy.food.types[type]}
              </GlassButton>
            ))}
          </FloatingGlassBar>
        </Field>
        <Field label={copy.food.categoryLabel}>
          <Input
            placeholder={copy.food.categoryPlaceholder}
            value={draft.category}
            onChangeText={(value) => update("category", value)}
          />
        </Field>
        <Field label={copy.food.portionNameLabel}>
          <Input
            placeholder={copy.food.portionNamePlaceholder}
            value={draft.portionName}
            onChangeText={(value) => update("portionName", value)}
          />
        </Field>
        <Field label={copy.food.portionGramsLabel}>
          <Input
            keyboardType="decimal-pad"
            value={draft.portionGrams}
            onChangeText={(value) => update("portionGrams", value)}
          />
        </Field>
        <Field label={copy.food.caloriesPer100g}>
          <Input
            keyboardType="decimal-pad"
            value={draft.calories}
            onChangeText={(value) => update("calories", value)}
          />
        </Field>
        <Field label={copy.food.proteinPer100g}>
          <Input
            keyboardType="decimal-pad"
            value={draft.protein}
            onChangeText={(value) => update("protein", value)}
          />
        </Field>
        <Field label={copy.food.carbsPer100g}>
          <Input
            keyboardType="decimal-pad"
            value={draft.carbohydrates}
            onChangeText={(value) => update("carbohydrates", value)}
          />
        </Field>
        <Field label={copy.food.fatPer100g}>
          <Input
            keyboardType="decimal-pad"
            value={draft.fat}
            onChangeText={(value) => update("fat", value)}
          />
        </Field>
        <Text variant="bodySm" tone="secondary">
          {copy.food.submissionNote}
        </Text>
        <Inline gap="sm">
          <Button variant="ghost" onPress={onCancel}>
            {copy.food.cancel}
          </Button>
          <Button loading={loading} onPress={onSubmit}>
            {copy.food.submitFood}
          </Button>
        </Inline>
      </Stack>
    </Surface>
  );
}

function NutritionPreview({
  grams,
  nutrition,
  approximate,
}: {
  grams: number;
  nutrition: NutritionValues;
  approximate: string;
}) {
  const { copy } = useI18n();
  return (
    <Surface elevation="none" style={styles.preview}>
      <Text variant="caption" tone="secondary">
        {formatNumber(grams)} g · {approximate}
      </Text>
      <Text variant="headingXl">{formatKcal(nutrition.energyKcal)}</Text>
      <Inline gap="md" align="start">
        <Macro label={copy.home.proteinLabel} value={nutrition.proteinG} />
        <Macro label={copy.home.carbohydratesLabel} value={nutrition.carbohydratesG} />
        <Macro label={copy.home.fatLabel} value={nutrition.fatG} />
      </Inline>
    </Surface>
  );
}

function InlineHeader({
  title,
  onBack,
  backLabel,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <View style={styles.headerRow}>
      <Text variant="headingMd">{title}</Text>
      {onBack ? (
        <Button size="sm" variant="ghost" onPress={onBack}>
          {backLabel}
        </Button>
      ) : null}
    </View>
  );
}

function Macro({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <Stack gap="xs" style={styles.macro}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="label">
        {value === null || value === undefined ? "—" : `${formatNumber(value)} g`}
      </Text>
    </Stack>
  );
}

function toNutrition(food: Food): NutritionValues {
  return {
    energyKcal: food.nutritionPer100g.energyKcal,
    proteinG: food.nutritionPer100g.proteinG,
    carbohydratesG: food.nutritionPer100g.carbohydratesG,
    fatG: food.nutritionPer100g.fatG,
    fiberG: food.nutritionPer100g.fiberG,
    sugarG: food.nutritionPer100g.sugarG,
    saturatedFatG: food.nutritionPer100g.saturatedFatG,
    sodiumMg: food.nutritionPer100g.sodiumMg,
  };
}

function toDraftEntry(entry: MealFoodEntry): DraftEntry {
  const per100 = (value: number | null) =>
    value === null || entry.grams <= 0 ? null : (value * 100) / entry.grams;
  const portionGrams = entry.quantity > 0 ? entry.grams / entry.quantity : entry.grams;
  return {
    food: {
      id: entry.foodId,
      name: entry.foodName,
      type: "generic",
      category: null,
      brand: null,
      barcode: null,
      nutritionPer100g: {
        energyKcal: per100(entry.energyKcal),
        proteinG: per100(entry.proteinG),
        carbohydratesG: per100(entry.carbohydratesG),
        fatG: per100(entry.fatG),
        fiberG: per100(entry.fiberG),
        sugarG: per100(entry.sugarG),
        saturatedFatG: per100(entry.saturatedFatG),
        sodiumMg: per100(entry.sodiumMg),
      },
      sourceType: "BOCCONE_CURATED",
      sourceId: null,
      sourceName: null,
      sourceUrl: null,
      qualityLevel: "boccone_verified",
      status: "APPROVED",
      portions: [
        {
          id: `meal-entry-${entry.id}`,
          name: entry.portionName,
          amount: 1,
          unit: "serving",
          gramWeight: portionGrams,
          isDefault: true,
          sourceType: "BOCCONE_CURATED",
        },
      ],
      aliases: [],
      isPrivate: false,
      createdAt: "",
      updatedAt: "",
    },
    portionName: entry.portionName,
    quantity: entry.quantity,
    grams: entry.grams,
  };
}

function emptyNutrition(): NutritionValues {
  return {
    energyKcal: 0,
    proteinG: 0,
    carbohydratesG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    saturatedFatG: 0,
    sodiumMg: 0,
  };
}
function addNutrition(left: NutritionValues, right: NutritionValues): NutritionValues {
  return {
    energyKcal: addKnown(left.energyKcal, right.energyKcal),
    proteinG: addKnown(left.proteinG, right.proteinG),
    carbohydratesG: addKnown(left.carbohydratesG, right.carbohydratesG),
    fatG: addKnown(left.fatG, right.fatG),
    fiberG: addKnown(left.fiberG, right.fiberG),
    sugarG: addKnown(left.sugarG, right.sugarG),
    saturatedFatG: addKnown(left.saturatedFatG, right.saturatedFatG),
    sodiumMg: addKnown(left.sodiumMg, right.sodiumMg),
  };
}
function addKnown(
  left: number | null | undefined,
  right: number | null | undefined,
): number | null {
  return left === null || left === undefined || right === null || right === undefined
    ? null
    : left + right;
}
function positiveNumber(value: string, fallback: number): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function nullableNumber(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toFixed(value % 1 === 0 ? 0 : 1);
}
function formatKcal(value: number | null | undefined): string {
  return value === null || value === undefined ? "— kcal" : `≈ ${Math.round(value)} kcal`;
}
function emptyProposal(): ProposalDraft {
  return {
    name: "",
    brand: "",
    type: "generic",
    category: "",
    portionName: "1 serving",
    portionGrams: "100",
    calories: "",
    protein: "",
    carbohydrates: "",
    fat: "",
  };
}
function categoryForCurrentTime(): MealCategory {
  const hour = new Date().getHours();
  return hour < 11 ? "breakfast" : hour < 16 ? "lunch" : hour < 21 ? "dinner" : "snack";
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing[6] },
  categoryBar: { flexWrap: "wrap" },
  categoryButton: { flexGrow: 1 },
  portionsBar: { flexWrap: "wrap" },
  quantityBar: { alignSelf: "flex-start" },
  proposalTypeBar: { flexWrap: "wrap" },
  entryRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  entryCopy: { flex: 1, gap: spacing[1] },
  entryAction: { alignItems: "flex-end", gap: spacing[1] },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  preview: { gap: spacing[2], padding: spacing[4] },
  totalSurface: { gap: spacing[3], padding: spacing[4] },
  macro: { flex: 1 },
});
