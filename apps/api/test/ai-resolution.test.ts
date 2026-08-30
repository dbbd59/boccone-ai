import { describe, expect, test } from "bun:test";

import type { MealInterpretationFood } from "@boccone/ai";
import type { Food, FoodSearchQuery, FoodSearchResponse } from "@boccone/contracts";

import { buildMealDraftFromCatalog } from "../src/services/ai";

const NOW = new Date("2026-08-30T12:00:00.000Z");

describe("deterministic meal draft resolution", () => {
  test("resolves exact grams and household portions from catalog nutrition", async () => {
    const pasta = makeFood("pasta-cotta", "Pasta cotta", 130, {
      name: "100 g",
      grams: 100,
    });
    const apple = makeFood("apple", "Mela", 52, { name: "medium apple", grams: 150 });
    const draft = await buildMealDraftFromCatalog(
      "it",
      {
        mealType: "lunch",
        foods: [
          interpretationFood("100 grammi di pasta cotta", "pasta cotta", {
            grams: 100,
            estimatedNutrition: {
              calories: 999,
              proteinGrams: 99,
              carbohydratesGrams: 99,
              fatGrams: 99,
            },
          }),
          interpretationFood("una mela", "mela", {
            quantity: 1,
            portionDescription: "medium apple",
          }),
        ],
      },
      catalogSearch([pasta], [apple]),
    );

    expect(draft.foods[0]).toMatchObject({
      normalizedName: "Pasta cotta",
      grams: 100,
      resolutionStatus: "RESOLVED",
      nutrition: { calories: 130 },
    });
    expect(draft.foods[1]).toMatchObject({
      normalizedName: "Mela",
      grams: 150,
      quantity: 1,
      resolutionStatus: "RESOLVED",
      nutrition: { calories: 78 },
    });
    expect(draft.totals.calories).toBe(208);
    expect(draft.nutritionIncomplete).toBe(false);
  });

  test("scales multiple quantities using a known portion", async () => {
    const apple = makeFood("apple", "Mela", 52, { name: "medium apple", grams: 150 });
    const yogurt = makeFood("yogurt", "Yogurt greco", 70, { name: "pot", grams: 125 });
    const draft = await buildMealDraftFromCatalog(
      "it",
      {
        foods: [
          interpretationFood("due mele", "mela", {
            quantity: 2,
            portionDescription: "medium apple",
          }),
          interpretationFood("150 grammi di yogurt greco", "yogurt greco", { grams: 150 }),
        ],
      },
      catalogSearch([apple], [yogurt]),
    );

    expect(draft.foods.map((food) => food.grams)).toEqual([300, 150]);
    expect(draft.totals.calories).toBe(261);
  });

  test("keeps similarly strong catalog matches ambiguous", async () => {
    const cooked = makeFood("pasta-cotta", "Pasta cotta", 130, { name: "100 g", grams: 100 });
    const dry = makeFood("pasta-secca", "Pasta secca", 350, { name: "100 g", grams: 100 });
    const draft = await buildMealDraftFromCatalog(
      "it",
      {
        foods: [interpretationFood("un piatto di pasta", "pasta", { portionDescription: "plate" })],
      },
      catalogSearch([cooked, dry]),
    );

    expect(draft.foods[0]).toMatchObject({
      resolutionStatus: "AMBIGUOUS",
      food: null,
      nutrition: null,
      candidates: [{ id: "pasta-cotta" }, { id: "pasta-secca" }],
    });
    expect(draft.nutritionIncomplete).toBe(true);
    expect(draft.totals.calories).toBeNull();
  });

  test("keeps unknown foods visible with an AI nutrition estimate", async () => {
    const draft = await buildMealDraftFromCatalog(
      "it",
      {
        foods: [
          interpretationFood("il panino speciale della nonna", "panino speciale della nonna", {
            portionDescription: "one sandwich",
            grams: 180,
            estimatedNutrition: {
              calories: 420,
              proteinGrams: 18,
              carbohydratesGrams: 45,
              fatGrams: 18,
            },
          }),
        ],
      },
      catalogSearch([]),
    );

    expect(draft.foods[0]).toMatchObject({
      sourceText: "il panino speciale della nonna",
      normalizedName: "panino speciale della nonna",
      resolutionStatus: "UNRESOLVED",
      food: null,
      candidates: [],
    });
    expect(draft.foods[0]?.nutrition).toEqual({
      calories: 420,
      proteinGrams: 18,
      carbohydratesGrams: 45,
      fatGrams: 18,
    });
    expect(draft.totals.calories).toBe(420);
    expect(draft.nutritionIncomplete).toBe(false);
  });
});

function interpretationFood(
  sourceText: string,
  normalizedName: string,
  values: Partial<MealInterpretationFood> = {},
): MealInterpretationFood {
  return {
    sourceText,
    normalizedName,
    confidence: 0.8,
    ...values,
  };
}

function catalogSearch(...groups: Food[][]) {
  const foods = groups.flat();
  return (_query: FoodSearchQuery): Promise<FoodSearchResponse> =>
    Promise.resolve({
      foods,
      recent: [],
      frequent: [],
    });
}

function makeFood(
  id: string,
  name: string,
  calories: number,
  portion: { name: string; grams: number },
): Food {
  return {
    id,
    name,
    type: "generic",
    category: null,
    brand: null,
    barcode: null,
    nutritionPer100g: {
      energyKcal: calories,
      proteinG: 5,
      carbohydratesG: 20,
      fatG: 2,
      fiberG: null,
      sugarG: null,
      saturatedFatG: null,
      sodiumMg: null,
    },
    sourceType: "BOCCONE_CURATED",
    sourceId: null,
    sourceName: null,
    sourceUrl: null,
    qualityLevel: "boccone_verified",
    status: "APPROVED",
    portions: [
      {
        id: `${id}-portion`,
        name: portion.name,
        amount: 1,
        unit: "serving",
        gramWeight: portion.grams,
        isDefault: true,
        sourceType: "BOCCONE_CURATED",
      },
    ],
    aliases: [],
    isPrivate: false,
    createdAt: NOW,
    updatedAt: NOW,
  };
}
