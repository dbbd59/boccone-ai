import { describe, expect, test } from "bun:test";

import { calculateNutrition, normalizeFoodName } from "../src";

const per100g = {
  energyKcal: 200,
  proteinG: 10,
  carbohydratesG: 30,
  fatG: 5,
  fiberG: null,
  sugarG: 4,
  saturatedFatG: null,
  sodiumMg: 80,
};

describe("nutrition calculations", () => {
  test("scales every known nutrient from 100 g", () => {
    expect(calculateNutrition(per100g, 50)).toEqual({
      energyKcal: 100,
      proteinG: 5,
      carbohydratesG: 15,
      fatG: 2.5,
      fiberG: null,
      sugarG: 2,
      saturatedFatG: null,
      sodiumMg: 40,
    });
  });

  test("rejects negative grams", () => {
    expect(() => calculateNutrition(per100g, -1)).toThrow("non-negative");
  });
});

test("normalizes Italian aliases and punctuation", () => {
  expect(normalizeFoodName("Tiramisù — crema! ")).toBe("tiramisu crema");
});
