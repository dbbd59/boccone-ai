export interface NutritionValues {
  energyKcal: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  saturatedFatG: number | null;
  sodiumMg: number | null;
}

export function calculateNutrition(per100g: NutritionValues, grams: number): NutritionValues {
  if (!Number.isFinite(grams) || grams < 0) throw new Error("Grams must be a non-negative number");
  return {
    energyKcal: scale(per100g.energyKcal, grams),
    proteinG: scale(per100g.proteinG, grams),
    carbohydratesG: scale(per100g.carbohydratesG, grams),
    fatG: scale(per100g.fatG, grams),
    fiberG: scale(per100g.fiberG, grams),
    sugarG: scale(per100g.sugarG, grams),
    saturatedFatG: scale(per100g.saturatedFatG, grams),
    sodiumMg: scale(per100g.sodiumMg, grams),
  };
}

export function nutritionFromFood(food: {
  energyKcalPer100g: number | null;
  proteinGPer100g: number | null;
  carbohydratesGPer100g: number | null;
  fatGPer100g: number | null;
  fiberGPer100g: number | null;
  sugarGPer100g: number | null;
  saturatedFatGPer100g: number | null;
  sodiumMgPer100g: number | null;
}): NutritionValues {
  return {
    energyKcal: food.energyKcalPer100g,
    proteinG: food.proteinGPer100g,
    carbohydratesG: food.carbohydratesGPer100g,
    fatG: food.fatGPer100g,
    fiberG: food.fiberGPer100g,
    sugarG: food.sugarGPer100g,
    saturatedFatG: food.saturatedFatGPer100g,
    sodiumMg: food.sodiumMgPer100g,
  };
}

export function roundNutrition(values: NutritionValues): NutritionValues {
  return {
    energyKcal: round(values.energyKcal, 1),
    proteinG: round(values.proteinG, 2),
    carbohydratesG: round(values.carbohydratesG, 2),
    fatG: round(values.fatG, 2),
    fiberG: round(values.fiberG, 2),
    sugarG: round(values.sugarG, 2),
    saturatedFatG: round(values.saturatedFatG, 2),
    sodiumMg: round(values.sodiumMg, 1),
  };
}

function scale(value: number | null | undefined, grams: number): number | null {
  return value === null || value === undefined ? null : (value * grams) / 100;
}

function round(value: number | null, decimals: number): number | null {
  return value === null ? null : Number(value.toFixed(decimals));
}
