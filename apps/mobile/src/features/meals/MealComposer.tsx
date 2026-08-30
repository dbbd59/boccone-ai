import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  Food,
  FoodType,
  FoodPortion,
  MealDraft,
  MealDraftFood,
  MealFoodEntry,
  MealFoodEntryUpdateInput,
  MealCategory,
} from "@boccone/api-client";
import { calculateNutrition, roundNutrition, type NutritionValues } from "@boccone/utils";
import { borderWidths, spacing } from "@boccone/design-tokens";
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
import { NutritionSummary } from "../../components/NutritionSummary";
import { QuantityControl } from "../../components/QuantityControl";
import { useI18n } from "../../i18n/context";
import type { TranslationCopy } from "../../i18n/translations";
import { formatLocalDate } from "../../lib/dates";
import { lightImpactFeedback } from "../../lib/haptics";
import { searchFoodCatalog, submitFood } from "../../lib/foods";
import { AiRequestError, interpretMeal } from "../../lib/ai";
import { createMeal, fetchMeal, updateMeal } from "../../lib/meals";

const CATEGORIES: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];

interface DraftEntry {
  key: string;
  id?: string;
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

export function MealComposer({
  mealId,
  initialDate,
}: { mealId?: string; initialDate?: string } = {}) {
  const { copy, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<MealCategory>(() => categoryForCurrentTime());
  const [mealDate, setMealDate] = useState(() => initialDate ?? formatLocalDate());
  const [mealName, setMealName] = useState("");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"dillo" | "manual">(mealId ? "manual" : "dillo");
  const [naturalText, setNaturalText] = useState("");
  const [aiDraft, setAiDraft] = useState<MealDraft | null>(null);
  const [aiReviewIndex, setAiReviewIndex] = useState<number | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<FoodPortion | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [customGrams, setCustomGrams] = useState("100");
  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState<ProposalDraft>(() => emptyProposal());
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
    setMealDate(mealQuery.data.date);
    setMealName(mealQuery.data.name);
    setNotes(mealQuery.data.notes ?? "");
    setEntries((mealQuery.data.entries ?? []).map(toDraftEntry));
  }, [mealQuery.data]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => () => aiAbortRef.current?.abort(), []);

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

  function clearSearch() {
    setQuery("");
    setShowProposal(false);
  }

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
  const requiresAiReview = aiDraft?.foods.some(needsAiReview) ?? false;

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        name: mealName.trim() || copy.meal.categories[category],
        category,
        date: mealDate,
        notes: notes.trim() || null,
        entries: entries.map<MealFoodEntryUpdateInput>((entry) => ({
          ...(entry.id ? { id: entry.id } : {}),
          foodId: entry.food.id,
          portionName: entry.portionName,
          quantity: entry.quantity,
          grams: entry.grams,
        })),
      };
      return mealId ? updateMeal(mealId, input) : createMeal(input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [{ _id: "getDailyMeals" }] }),
        queryClient.invalidateQueries({ queryKey: [{ _id: "getMealDiary" }] }),
      ]);
      await queryClient.invalidateQueries({ queryKey: [{ _id: "getCalendarMonth" }] });
      if (mealId) {
        await queryClient.invalidateQueries({ queryKey: ["mobile-meal", mealId] });
        router.back();
      } else {
        router.replace("/meals");
      }
    },
    onError: () => setError(copy.food.error),
  });

  const aiMutation = useMutation({
    mutationFn: async () => {
      const controller = new AbortController();
      aiAbortRef.current = controller;
      try {
        return await interpretMeal(
          {
            text: naturalText.trim(),
            locale,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          },
          controller.signal,
        );
      } finally {
        if (aiAbortRef.current === controller) aiAbortRef.current = null;
      }
    },
    onMutate: () => setError(null),
    onSuccess: ({ draft }) => {
      setAiDraft(draft);
      setAiReviewIndex(null);
      if (draft.mealType) setCategory(draft.mealType);
      if (draft.mealName) setMealName(draft.mealName);
      setNotes(draft.notes ?? "");
      setEntries(
        draft.foods.flatMap((food, index) => {
          const entry = toAiDraftEntry(food, index);
          return entry ? [entry] : [];
        }),
      );
      setMode("manual");
      setError(null);
    },
    onError: (cause) => {
      if (cause instanceof AiRequestError && cause.code === "ai_cancelled") {
        setError(null);
        return;
      }
      setError(aiErrorMessage(cause, copy));
    },
  });

  function cancelAiInterpretation() {
    aiAbortRef.current?.abort();
  }

  function removeAiDraftFood(index: number) {
    setAiDraft((current) => {
      if (!current) return current;
      const foods = current.foods.filter((_food, itemIndex) => itemIndex !== index);
      const totals = summarizeDraftNutrition(foods);
      return {
        ...current,
        foods,
        totals: totals.values,
        nutritionIncomplete: totals.incomplete,
      };
    });
    setAiReviewIndex(null);
    setError(null);
    lightImpactFeedback();
  }

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
    onSuccess: async (food) => {
      await queryClient.invalidateQueries({ queryKey: ["food-catalog"] });
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

  function appendDefaultFood(food: Food) {
    const defaultPortion = food.portions.find((portion) => portion.isDefault) ?? food.portions[0];
    const grams = defaultPortion?.gramWeight ?? 100;
    setEntries((current) => [
      ...current,
      {
        key: draftEntryKey(food.id),
        food,
        portionName: defaultPortion?.name ?? `${formatNumber(grams)} g`,
        quantity: 1,
        grams,
      },
    ]);
    setError(null);
    lightImpactFeedback();
  }

  function adjustQuantity(amount: number) {
    setQuantity((current) => formatNumber(Math.max(0.1, positiveNumber(current, 1) + amount)));
  }

  function adjustGrams(amount: number) {
    setCustomGrams((current) => formatNumber(Math.max(1, positiveNumber(current, 100) + amount)));
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
      key:
        editingIndex !== null && entries[editingIndex]
          ? entries[editingIndex].key
          : draftEntryKey(selectedFood.id),
      ...(editingIndex !== null && entries[editingIndex]?.id
        ? { id: entries[editingIndex]?.id }
        : {}),
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
    if (aiReviewIndex !== null) {
      setAiDraft((current) =>
        current
          ? replaceAiDraftFood(
              current,
              aiReviewIndex,
              selectedFood,
              nextEntry.portionName,
              nextEntry.quantity,
              nextEntry.grams,
            )
          : current,
      );
      setAiReviewIndex(null);
    }
    setEditingIndex(null);
    setSelectedFood(null);
    setSelectedPortion(null);
    setQuery("");
    lightImpactFeedback();
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
            <Stack gap="sm">
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
                  {mealId
                    ? copy.meal.editTitle
                    : mode === "dillo"
                      ? copy.food.dilloTitle
                      : copy.food.title}
                </Text>
              </Inline>
              <Text variant="bodyLg" tone="secondary">
                {mode === "dillo" && !mealId ? copy.food.dilloHint : copy.food.searchHint}
              </Text>
            </Stack>

            {!mealId ? (
              <FloatingGlassBar mergeSpacing={spacing[1]} style={styles.modeBar}>
                <GlassButton
                  prominence={mode === "dillo" ? "prominent" : "regular"}
                  size="sm"
                  onPress={() => setMode("dillo")}
                >
                  {copy.food.dilloTitle}
                </GlassButton>
                <GlassButton
                  prominence={mode === "manual" ? "prominent" : "regular"}
                  size="sm"
                  onPress={() => {
                    setAiReviewIndex(null);
                    setMode("manual");
                  }}
                >
                  {copy.food.dilloSwitchManual}
                </GlassButton>
              </FloatingGlassBar>
            ) : null}

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

            <Surface>
              <Stack gap="md">
                <Field label={copy.meal.nameLabel}>
                  <Input
                    value={mealName}
                    onChangeText={setMealName}
                    placeholder={copy.meal.namePlaceholder}
                  />
                </Field>
                <Field label={copy.meal.dateLabel} description={copy.meal.dateDescription}>
                  <Input
                    value={mealDate}
                    onChangeText={setMealDate}
                    placeholder={copy.meal.datePlaceholder}
                    autoCapitalize="none"
                  />
                </Field>
                <Field label={copy.meal.notesLabel} description={copy.meal.notesDescription}>
                  <Input
                    multiline
                    numberOfLines={3}
                    value={notes}
                    onChangeText={setNotes}
                    style={styles.notesInput}
                  />
                </Field>
              </Stack>
            </Surface>

            {entries.length > 0 ? (
              <Surface>
                <Stack gap="md">
                  <Inline align="center" justify="between">
                    <Text variant="headingMd">{copy.food.selectedFoods}</Text>
                    <Text variant="caption" tone="secondary">
                      {entries.length}
                    </Text>
                  </Inline>
                  {entries.map((entry, index) => (
                    <MealEntryRow
                      key={entry.key}
                      calories={formatKcal(
                        calculateNutrition(toNutrition(entry.food), entry.grams).energyKcal,
                      )}
                      detail={`${entry.portionName} · ${formatNumber(entry.grams)} g`}
                      name={entry.food.name}
                      onEdit={() => editEntry(index)}
                      onRemove={() => {
                        setEntries((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        );
                        lightImpactFeedback();
                      }}
                    />
                  ))}
                </Stack>
              </Surface>
            ) : null}

            {aiDraft ? (
              <AiDraftReview
                draft={aiDraft}
                onUseCandidate={(food, index) => {
                  setAiReviewIndex(index);
                  selectFood(food);
                  setMode("manual");
                }}
                onAddCustomFood={(item, index) => {
                  setAiReviewIndex(index);
                  setMode("manual");
                  const estimatedNutrition = item.nutrition;
                  const estimatedPer100g =
                    isCompleteDraftNutrition(estimatedNutrition) &&
                    item.grams !== null &&
                    item.grams > 0
                      ? {
                          calories: (estimatedNutrition.calories * 100) / item.grams,
                          protein: (estimatedNutrition.proteinGrams * 100) / item.grams,
                          carbohydrates: (estimatedNutrition.carbohydratesGrams * 100) / item.grams,
                          fat: (estimatedNutrition.fatGrams * 100) / item.grams,
                        }
                      : null;
                  setProposal((current) => ({
                    ...current,
                    name: item.normalizedName || item.sourceText,
                    portionName: item.portionName,
                    portionGrams:
                      item.grams !== null ? formatNumber(item.grams) : current.portionGrams,
                    calories:
                      estimatedPer100g === null
                        ? current.calories
                        : formatNumber(estimatedPer100g.calories),
                    protein:
                      estimatedPer100g === null
                        ? current.protein
                        : formatNumber(estimatedPer100g.protein),
                    carbohydrates:
                      estimatedPer100g === null
                        ? current.carbohydrates
                        : formatNumber(estimatedPer100g.carbohydrates),
                    fat:
                      estimatedPer100g === null ? current.fat : formatNumber(estimatedPer100g.fat),
                  }));
                  setShowProposal(true);
                }}
                onSearchCatalog={(index) => {
                  const item = aiDraft.foods[index];
                  setAiReviewIndex(index);
                  setMode("manual");
                  setSelectedFood(null);
                  setSelectedPortion(null);
                  setEditingIndex(null);
                  setShowProposal(false);
                  setQuery(item?.normalizedName ?? "");
                  setError(null);
                }}
                onRemoveItem={removeAiDraftFood}
              />
            ) : null}

            {mode === "dillo" && !mealId ? (
              <Surface>
                <Stack gap="md">
                  <Field label={copy.food.dilloTitle}>
                    <Input
                      autoFocus
                      multiline
                      numberOfLines={4}
                      placeholder={copy.food.dilloPlaceholder}
                      value={naturalText}
                      onChangeText={setNaturalText}
                      style={styles.naturalInput}
                    />
                  </Field>
                  <Button
                    fullWidth
                    disabled={!naturalText.trim()}
                    loading={aiMutation.isPending}
                    onPress={() => aiMutation.mutate()}
                  >
                    {aiMutation.isError ? copy.food.dilloRetry : copy.food.dilloSubmit}
                  </Button>
                  {aiMutation.isPending ? (
                    <>
                      <Text role="status" tone="secondary">
                        {copy.food.dilloProcessing}
                      </Text>
                      <Button variant="ghost" onPress={cancelAiInterpretation}>
                        {copy.food.dilloCancel}
                      </Button>
                    </>
                  ) : null}
                </Stack>
              </Surface>
            ) : !selectedFood ? (
              <Surface>
                <Stack gap="md">
                  <Field label={copy.food.searchLabel}>
                    <Inline gap="sm" align="center" style={styles.searchRow}>
                      <Input
                        autoFocus
                        placeholder={copy.food.searchPlaceholder}
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        style={styles.searchInput}
                      />
                      {query ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          accessibilityLabel={copy.food.clearSearch}
                          onPress={clearSearch}
                        >
                          {copy.food.clearSearch}
                        </Button>
                      ) : null}
                    </Inline>
                  </Field>
                  {!query.trim() ? (
                    <Stack gap="xs">
                      <Text variant="caption" tone="secondary">
                        {copy.food.quickSearchesLabel}
                      </Text>
                      <Inline gap="sm" wrap>
                        {copy.food.quickSearches.map((term) => (
                          <Button
                            key={term}
                            size="sm"
                            variant="secondary"
                            onPress={() => setQuery(term)}
                          >
                            {term}
                          </Button>
                        ))}
                      </Inline>
                    </Stack>
                  ) : null}
                  {foodQuery.isPending ? (
                    <Text role="status" tone="secondary">
                      {copy.food.loading}
                    </Text>
                  ) : null}
                  {query.trim() && debouncedQuery !== query && !foodQuery.isPending ? (
                    <Text role="status" tone="secondary">
                      {copy.food.loading}
                    </Text>
                  ) : null}
                  {foodQuery.isError ? <Alert tone="danger" message={copy.food.error} /> : null}
                  {!query.trim() && foodQuery.data?.recent.length ? (
                    <FoodSection
                      title={copy.food.recent}
                      foods={foodQuery.data.recent}
                      onQuickAdd={appendDefaultFood}
                      onSelect={selectFood}
                    />
                  ) : null}
                  {!query.trim() && foodQuery.data?.frequent.length ? (
                    <FoodSection
                      title={copy.food.frequent}
                      foods={foodQuery.data.frequent}
                      onQuickAdd={appendDefaultFood}
                      onSelect={selectFood}
                    />
                  ) : null}
                  {!query.trim() && foodQuery.data?.foods.length ? (
                    <FoodSection
                      title={copy.food.suggestions}
                      foods={foodQuery.data.foods}
                      onQuickAdd={appendDefaultFood}
                      onSelect={selectFood}
                    />
                  ) : null}
                  {query.trim() && debouncedQuery === query && foodQuery.data?.foods.length ? (
                    <FoodSection
                      title={copy.food.resultsFor(debouncedQuery.trim())}
                      foods={foodQuery.data.foods}
                      onQuickAdd={appendDefaultFood}
                      onSelect={selectFood}
                    />
                  ) : null}
                  {query.trim() &&
                  debouncedQuery === query &&
                  !foodQuery.isPending &&
                  foodQuery.data?.foods.length === 0 ? (
                    <Stack gap="sm">
                      <Text variant="bodySm" tone="secondary">
                        {copy.food.noResultsFor(debouncedQuery.trim())}
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
                          onQuickAdd={appendDefaultFood}
                          onSelect={selectFood}
                        />
                      ) : null}
                      {similarSearchTerm && similarSearchTerm !== debouncedQuery.trim() ? (
                        <Button variant="ghost" onPress={() => setQuery(similarSearchTerm)}>
                          {copy.food.tryShorter(similarSearchTerm)}
                        </Button>
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
                      onCancel={() => {
                        setShowProposal(false);
                        setAiReviewIndex(null);
                      }}
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
                      setAiReviewIndex(null);
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
                    <QuantityControl
                      decrementLabel={copy.food.decrement}
                      incrementLabel={copy.food.increment}
                      label={copy.food.quantityLabel}
                      onChangeText={setQuantity}
                      onDecrement={() => adjustQuantity(-0.5)}
                      onIncrement={() => adjustQuantity(0.5)}
                      stepLabel={copy.food.portionStep}
                      value={quantity}
                    />
                  ) : (
                    <QuantityControl
                      decrementLabel={copy.food.decrement}
                      incrementLabel={copy.food.increment}
                      label={copy.food.gramsLabel}
                      onChangeText={setCustomGrams}
                      onDecrement={() => adjustGrams(-10)}
                      onIncrement={() => adjustGrams(10)}
                      stepLabel={copy.food.gramsStep}
                      value={customGrams}
                    />
                  )}
                  {selectedPreview ? (
                    <NutritionPreview
                      grams={selectedPreview.grams}
                      nutrition={selectedPreview.nutrition}
                      approximate={copy.food.approximate}
                    />
                  ) : null}
                  <Button fullWidth onPress={addSelectedFood}>
                    {editingIndex === null ? copy.food.addToMeal : copy.food.updateEntry}
                  </Button>
                </Stack>
              </Surface>
            )}

            {entries.length > 0 ? (
              <NutritionSummary
                calories={total.energyKcal}
                carbohydrates={total.carbohydratesG}
                compact
                fat={total.fatG}
                incomplete={false}
                label={copy.food.mealTotal}
                protein={total.proteinG}
                showTarget={false}
              />
            ) : null}
          </Stack>
        </ScrollView>
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background.default,
              borderTopColor: colors.border.subtle,
              paddingBottom: Math.max(insets.bottom, spacing[2]),
            },
          ]}
        >
          {requiresAiReview ? (
            <Text role="status" variant="bodySm" tone="secondary">
              {copy.food.dilloSaveAfterReview}
            </Text>
          ) : null}
          {error ? <Alert tone="danger" message={error} /> : null}
          <Button
            fullWidth
            disabled={entries.length === 0 || requiresAiReview}
            loading={saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
          >
            {mealId ? copy.meal.saveChanges : copy.food.saveMeal}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function FoodSection({
  title,
  foods,
  onSelect,
  onQuickAdd,
}: {
  title: string;
  foods: Food[];
  onSelect: (food: Food) => void;
  onQuickAdd?: (food: Food) => void;
}) {
  return (
    <Stack gap="xs">
      <Text variant="label" tone="secondary">
        {title}
      </Text>
      {foods.map((food) => (
        <FoodSearchResult
          key={food.id}
          food={food}
          onQuickAdd={onQuickAdd ? () => onQuickAdd(food) : undefined}
          onSelect={() => onSelect(food)}
        />
      ))}
    </Stack>
  );
}

function AiDraftReview({
  draft,
  onUseCandidate,
  onAddCustomFood,
  onSearchCatalog,
  onRemoveItem,
}: {
  draft: MealDraft;
  onUseCandidate: (food: Food, index: number) => void;
  onAddCustomFood: (food: MealDraftFood, index: number) => void;
  onSearchCatalog: (index: number) => void;
  onRemoveItem: (index: number) => void;
}) {
  const { copy } = useI18n();
  const attention = draft.foods.filter(needsAiReview);
  if (attention.length === 0 && !draft.nutritionIncomplete) return null;
  return (
    <Surface>
      <Stack gap="md">
        <Text variant="headingMd">{copy.food.dilloReviewTitle}</Text>
        <Text variant="bodySm" tone="secondary">
          {copy.food.dilloReviewBody}
        </Text>
        {attention.length > 0 ? (
          <Text variant="caption" tone="secondary">
            {copy.food.dilloReviewCount(attention.length)}
          </Text>
        ) : null}
        {draft.totals.calories !== null ? (
          <NutritionSummary
            calories={draft.totals.calories}
            carbohydrates={draft.totals.carbohydratesGrams}
            compact
            fat={draft.totals.fatGrams}
            label={copy.food.dilloEstimate}
            protein={draft.totals.proteinGrams}
            showTarget={false}
          />
        ) : null}
        {attention.length === 0 && draft.nutritionIncomplete ? (
          <Text variant="bodySm" tone="secondary">
            {copy.food.dilloNoNutrition}
          </Text>
        ) : null}
        {attention.map((item) => {
          const index = draft.foods.indexOf(item);
          return (
            <Stack key={`${item.sourceText}-${index}`} gap="sm">
              <Text variant="label">{item.normalizedName}</Text>
              <Text variant="bodySm" tone="secondary">
                {item.resolutionStatus === "AMBIGUOUS"
                  ? copy.food.dilloAmbiguous
                  : item.resolutionStatus === "UNRESOLVED"
                    ? copy.food.dilloUnresolved
                    : copy.food.dilloNoNutrition}
              </Text>
              {item.nutrition ? (
                <Stack gap="xs">
                  <Text variant="caption" tone="secondary">
                    {copy.food.dilloEstimate}
                    {item.grams !== null ? ` · ${formatNumber(item.grams)} g` : ""} ·{" "}
                    {formatKcal(item.nutrition.calories)}
                  </Text>
                  <Inline gap="sm" align="start">
                    <Macro label={copy.home.proteinLabel} value={item.nutrition.proteinGrams} />
                    <Macro
                      label={copy.home.carbohydratesLabel}
                      value={item.nutrition.carbohydratesGrams}
                    />
                    <Macro label={copy.home.fatLabel} value={item.nutrition.fatGrams} />
                  </Inline>
                </Stack>
              ) : null}
              {item.candidates.map((candidate) => (
                <Button
                  key={candidate.id}
                  size="sm"
                  variant="secondary"
                  onPress={() => onUseCandidate(candidate, index)}
                >
                  {copy.food.dilloUseCandidate}: {candidate.name}
                </Button>
              ))}
              {!item.food ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    accessibilityLabel={`${copy.food.dilloAddCustomFood}: ${item.normalizedName}`}
                    onPress={() => onAddCustomFood(item, index)}
                  >
                    {copy.food.dilloAddCustomFood}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    accessibilityLabel={`${copy.food.dilloSearchCatalog}: ${item.normalizedName}`}
                    onPress={() => onSearchCatalog(index)}
                  >
                    {copy.food.dilloSearchCatalog}
                  </Button>
                </>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                accessibilityLabel={`${copy.food.dilloRemoveItem}: ${item.normalizedName}`}
                onPress={() => onRemoveItem(index)}
              >
                {copy.food.dilloRemoveItem}
              </Button>
            </Stack>
          );
        })}
      </Stack>
    </Surface>
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

function toAiDraftEntry(food: MealDraftFood, index: number): DraftEntry | null {
  if (
    !food.food ||
    food.grams === null ||
    food.nutrition === null ||
    Object.values(food.nutrition).some((value) => value === null)
  )
    return null;
  return {
    key: `ai-${food.food.id}-${index}`,
    food: food.food,
    portionName: food.portionName,
    quantity: food.quantity,
    grams: food.grams,
  };
}

function isCompleteDraftNutrition(nutrition: MealDraftFood["nutrition"]): nutrition is {
  calories: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  fatGrams: number;
} {
  return nutrition !== null && Object.values(nutrition).every((value) => value !== null);
}

function needsAiReview(food: MealDraftFood): boolean {
  return food.resolutionStatus === "AMBIGUOUS" || food.resolutionStatus === "UNRESOLVED";
}

function replaceAiDraftFood(
  draft: MealDraft,
  index: number,
  food: Food,
  portionName: string,
  quantity: number,
  grams: number,
): MealDraft {
  const nutritionValues = roundNutrition(calculateNutrition(toNutrition(food), grams));
  const nutrition = {
    calories: nutritionValues.energyKcal,
    proteinGrams: nutritionValues.proteinG,
    carbohydratesGrams: nutritionValues.carbohydratesG,
    fatGrams: nutritionValues.fatG,
  };
  const complete = Object.values(nutrition).every((value) => value !== null);
  const foods = draft.foods.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          normalizedName: food.name,
          food,
          candidates: [],
          portionName,
          quantity,
          grams,
          nutrition,
          confidence: Math.max(item.confidence, complete ? 0.95 : item.confidence),
          resolutionStatus: complete ? ("RESOLVED" as const) : ("ESTIMATED" as const),
          reviewNote: complete ? null : item.reviewNote,
        }
      : item,
  );
  const totals = summarizeDraftNutrition(foods);
  return {
    ...draft,
    foods,
    totals: totals.values,
    nutritionIncomplete: totals.incomplete,
  };
}

function summarizeDraftNutrition(foods: MealDraftFood[]) {
  const keys = ["calories", "proteinGrams", "carbohydratesGrams", "fatGrams"] as const;
  const values = Object.fromEntries(
    keys.map((key) => {
      const known = foods
        .map((food) => food.nutrition?.[key])
        .filter((value): value is number => value !== null && value !== undefined);
      return [
        key,
        known.length === foods.length
          ? Number(known.reduce((sum, value) => sum + value, 0).toFixed(2))
          : null,
      ];
    }),
  ) as MealDraft["totals"];
  return {
    values,
    incomplete: foods.some(
      (food) => food.nutrition === null || keys.some((key) => food.nutrition?.[key] === null),
    ),
  };
}

function aiErrorMessage(error: unknown, copy: TranslationCopy): string {
  if (!(error instanceof AiRequestError)) return copy.food.dilloGenericError;
  switch (error.code) {
    case "ai_not_configured":
    case "ai_secret_unavailable":
      return copy.food.dilloConfigure;
    case "ai_invalid_credentials":
      return copy.food.dilloInvalidCredentials;
    case "ai_rate_limited":
      return copy.food.dilloRateLimited;
    case "ai_provider_unavailable":
      return copy.food.dilloUnavailable;
    case "ai_timeout":
      return copy.food.dilloTimeout;
    case "ai_invalid_response":
      return copy.food.dilloInvalidResponse;
    default:
      return copy.food.dilloGenericError;
  }
}

function toDraftEntry(entry: MealFoodEntry): DraftEntry {
  const per100 = (value: number | null) =>
    value === null || entry.grams <= 0 ? null : (value * 100) / entry.grams;
  const portionGrams = entry.quantity > 0 ? entry.grams / entry.quantity : entry.grams;
  return {
    key: entry.id,
    id: entry.id,
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

function draftEntryKey(foodId: string): string {
  return `draft-${foodId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  modeBar: { flexWrap: "wrap" },
  searchRow: { alignItems: "center" },
  searchInput: { flex: 1, minWidth: 0 },
  naturalInput: { minHeight: spacing[12], textAlignVertical: "top" },
  notesInput: { minHeight: spacing[12], textAlignVertical: "top" },
  portionsBar: { flexWrap: "wrap" },
  proposalTypeBar: { flexWrap: "wrap" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  preview: { gap: spacing[2], padding: spacing[4] },
  macro: { flex: 1 },
  footer: {
    gap: spacing[2],
    borderTopWidth: borderWidths.hairline,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
  },
});
