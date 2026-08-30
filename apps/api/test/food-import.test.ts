import { describe, expect, test } from "bun:test";

import { parseFoodExport } from "../src/services/food-import";
import { validateNutrition } from "../src/services/foods";

describe("downloaded food exports", () => {
  test("maps USDA JSON export records to local records", () => {
    const [food] = parseFoodExport(
      {
        foods: [
          {
            fdcId: 123,
            description: "Apple, raw",
            dataType: "Foundation",
            foodCategory: "Fruits",
            foodNutrients: [
              { nutrientId: 1008, value: 52 },
              { nutrientId: 1003, value: 0.3 },
              { nutrientId: 1005, value: 13.8 },
              { nutrientId: 1004, value: 0.2 },
            ],
            foodPortions: [{ modifier: "1 medium", gramWeight: 182 }],
          },
        ],
      },
      "fdc-json",
      "USDA",
    );

    expect(food).toMatchObject({
      externalId: "123",
      name: "Mela",
      type: "generic",
      sourceType: "USDA",
      sourceName: "Apple, raw",
      nutritionPer100g: { energyKcal: 52, proteinG: 0.3 },
      portions: [{ name: "1 medium", gramWeight: 182 }],
    });
    expect(food?.aliases?.some((alias) => alias.locale === "en" && alias.name === "Apple")).toBe(
      true,
    );
    expect(food?.aliases?.some((alias) => alias.locale === "it" && alias.name === "Mela")).toBe(
      true,
    );
  });

  test("maps Open Food Facts JSONL product records", () => {
    const [food] = parseFoodExport(
      [
        {
          code: "8000000000000",
          product_name_it: "Pasta secca",
          brands: "Boccone",
          serving_quantity: "80",
          nutriments: {
            "energy-kcal_100g": 350,
            proteins_100g: 12,
            carbohydrates_100g: 70,
            fat_100g: 2,
          },
        },
      ],
      "off-jsonl",
      "OPEN_FOOD_FACTS",
    );

    expect(food).toMatchObject({
      externalId: "8000000000000",
      name: "Pasta secca",
      type: "branded",
      barcode: "8000000000000",
      nutritionPer100g: { energyKcal: 350, proteinG: 12 },
      portions: [{ gramWeight: 80 }],
    });
  });

  test("maps USDA CSV export rows", () => {
    const [food] = parseFoodExport(
      {
        foodCsv: [
          "fdc_id,data_type,description,food_category_id,brand_owner,gtin_upc",
          "456,Foundation,Apple,1,,,",
        ].join("\n"),
        foodNutrientCsv: [
          "fdc_id,nutrient_id,amount",
          "456,2047,52",
          "456,1003,0.3",
          "456,1005,13.8",
          "456,1004,0.2",
        ].join("\n"),
        foodPortionCsv: "fdc_id,amount,unit_name,modifier,gram_weight\n456,1,g,1 medium,182",
        foodCategoryCsv: "id,description\n1,Fruits",
      },
      "fdc-csv",
      "USDA",
    );

    expect(food).toMatchObject({
      externalId: "456",
      name: "Mela",
      category: "Fruits",
      nutritionPer100g: { energyKcal: 52, proteinG: 0.3 },
      portions: [{ name: "1 medium", gramWeight: 182 }],
    });
  });

  test("maps plural USDA bases to Italian names and aliases", () => {
    const [food] = parseFoodExport(
      {
        foodCsv: [
          "fdc_id,data_type,description,food_category_id,brand_owner,gtin_upc",
          '789,Foundation,"Apples, Fuji, With Skin, Raw",1,,,',
        ].join("\n"),
        foodNutrientCsv: [
          "fdc_id,nutrient_id,amount",
          "789,1008,52",
          "789,1003,0.3",
          "789,1005,13.8",
          "789,1004,0.2",
        ].join("\n"),
        foodCategoryCsv: "id,description\n1,Fruits",
      },
      "fdc-csv",
      "USDA",
    );

    expect(food?.name).toBe("Mela · Fuji, con buccia");
    expect(food?.aliases?.some((alias) => alias.locale === "it" && alias.name === "Mele")).toBe(
      true,
    );
  });

  test("removes USDA category wrappers for beverage search", () => {
    const [food] = parseFoodExport(
      {
        foodCsv: [
          "fdc_id,data_type,description,food_category_id,brand_owner,gtin_upc",
          '790,SR Legacy,"Beverages, Coffee, Brewed, Prepared With Tap Water, Regular",1,,,',
        ].join("\n"),
        foodNutrientCsv: [
          "fdc_id,nutrient_id,amount",
          "790,1008,2",
          "790,1003,0.3",
          "790,1005,0",
          "790,1004,0",
        ].join("\n"),
        foodCategoryCsv: "id,description\n1,Beverages",
      },
      "fdc-csv",
      "USDA",
    );

    expect(food?.name.startsWith("Caffè")).toBe(true);
    expect(food?.aliases?.some((alias) => alias.locale === "it" && alias.name === "Caffè")).toBe(
      true,
    );
  });

  test("removes USDA category wrappers for flour search", () => {
    const [food] = parseFoodExport(
      {
        foodCsv: [
          "fdc_id,data_type,description,food_category_id,brand_owner,gtin_upc",
          '791,SR Legacy,"Cereals, Farina, Enriched, Cooked With Water, With Salt",1,,,',
        ].join("\n"),
        foodNutrientCsv: [
          "fdc_id,nutrient_id,amount",
          "791,1008,60",
          "791,1003,2",
          "791,1005,10",
          "791,1004,1",
        ].join("\n"),
        foodCategoryCsv: "id,description\n1,Cereals",
      },
      "fdc-csv",
      "USDA",
    );

    expect(food?.name).toBe("Farina · arricchito, cotto con acqua, con sale");
  });
});

test("flags incomplete or inconsistent nutrition for admin review", () => {
  expect(
    validateNutrition({
      energyKcalPer100g: 900,
      proteinGPer100g: 1,
      carbohydratesGPer100g: 1,
      fatGPer100g: 1,
      fiberGPer100g: null,
      sugarGPer100g: null,
      saturatedFatGPer100g: null,
      sodiumMgPer100g: null,
    }),
  ).toContain("Energy is inconsistent with macros");
  const suspiciousFlags = validateNutrition({
    energyKcalPer100g: 1_500,
    proteinGPer100g: 1,
    carbohydratesGPer100g: 1,
    fatGPer100g: 1,
    fiberGPer100g: null,
    sugarGPer100g: null,
    saturatedFatGPer100g: null,
    sodiumMgPer100g: 12_000,
  });
  expect(suspiciousFlags).toContain("Calories are unusually high");
  expect(suspiciousFlags).toContain("Sodium is unusually high");
});
