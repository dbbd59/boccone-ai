import { type FoodSourceType, type FoodType, type NutritionPer100g } from "@boccone/contracts";
import { and, eq, foodAliases, foodPortions, foods, type Database } from "@boccone/db";
import { normalizeFoodName } from "@boccone/utils";

export interface ImportedFoodRecord {
  externalId: string;
  name: string;
  type: FoodType;
  category?: string | null;
  brand?: string | null;
  barcode?: string | null;
  nutritionPer100g: NutritionPer100g;
  sourceType: FoodSourceType;
  sourceName?: string | null;
  sourceUrl?: string | null;
  aliases?: { locale: string; name: string }[];
  portions?: {
    name: string;
    amount?: number;
    unit?: string;
    gramWeight: number;
  }[];
  isFeatured?: boolean;
}

export interface ImportSummary {
  received: number;
  inserted: number;
  updated: number;
  skipped: number;
}

export async function importFoodRecords(
  db: Database,
  records: Iterable<ImportedFoodRecord>,
): Promise<ImportSummary> {
  const summary: ImportSummary = { received: 0, inserted: 0, updated: 0, skipped: 0 };
  for (const record of records) {
    summary.received += 1;
    const nutrition = sanitizeImportedNutrition(record.nutritionPer100g);
    if (!record.name.trim() || !record.externalId.trim() || !hasCompleteCoreNutrition(nutrition)) {
      summary.skipped += 1;
      continue;
    }
    const existing = await findSourceFood(db, record.sourceType, record.externalId);
    const values = {
      name: record.name.trim(),
      normalizedName: normalizeFoodName(record.name),
      type: record.type,
      category: record.category ?? null,
      brand: record.brand ?? null,
      barcode: record.barcode ?? null,
      energyKcalPer100g: nutrition.energyKcal,
      proteinGPer100g: nutrition.proteinG,
      carbohydratesGPer100g: nutrition.carbohydratesG,
      fatGPer100g: nutrition.fatG,
      fiberGPer100g: nutrition.fiberG,
      sugarGPer100g: nutrition.sugarG,
      saturatedFatGPer100g: nutrition.saturatedFatG,
      sodiumMgPer100g: nutrition.sodiumMg,
      sourceType: record.sourceType,
      sourceId: record.externalId,
      sourceName: record.sourceName ?? record.name.trim(),
      sourceUrl: record.sourceUrl ?? null,
      qualityLevel: qualityForSource(record.sourceType),
      status: "APPROVED",
      ownerUserId: null,
      isFeatured: record.isFeatured ?? false,
      updatedAt: new Date(),
    } as const;

    let foodId: string;
    if (existing) {
      foodId = existing.id;
      await db.update(foods).set(values).where(eq(foods.id, existing.id));
      summary.updated += 1;
    } else {
      foodId = crypto.randomUUID();
      await db.insert(foods).values({ ...values, id: foodId });
      summary.inserted += 1;
    }

    await replaceAliases(db, foodId, record.aliases ?? []);
    await replacePortions(db, foodId, record.portions ?? [], record.sourceType);
  }
  return summary;
}

export function parseFoodExport(
  payload: unknown,
  format: "fdc-json" | "fdc-csv" | "off-jsonl" | "simple-csv",
  sourceType: FoodSourceType,
): ImportedFoodRecord[] {
  if (format === "fdc-json") return parseFdcJson(payload, sourceType);
  if (format === "fdc-csv") return parseFdcCsv(payload, sourceType);
  if (format === "off-jsonl") {
    if (!Array.isArray(payload))
      throw new Error("Open Food Facts JSONL must be parsed as an array of products");
    return payload.flatMap((product) => parseOffProduct(product));
  }
  if (!Array.isArray(payload)) throw new Error("Simple CSV input must be parsed as rows");
  return payload.flatMap((row) => parseSimpleCsvRow(row, sourceType));
}

function parseFdcCsv(payload: unknown, sourceType: FoodSourceType): ImportedFoodRecord[] {
  const files = asRecord(payload);
  const foodCsv = typeof files?.["foodCsv"] === "string" ? files["foodCsv"] : null;
  const foodNutrientCsv =
    typeof files?.["foodNutrientCsv"] === "string" ? files["foodNutrientCsv"] : null;
  if (!foodCsv || !foodNutrientCsv) {
    throw new Error("FDC CSV input must include food.csv and food_nutrient.csv");
  }

  const foodRows = parseCsvRows(foodCsv);
  const nutrientRows = parseCsvRows(foodNutrientCsv);
  const portionRows = parseCsvRows(
    typeof files?.["foodPortionCsv"] === "string" ? files["foodPortionCsv"] : "",
  );
  const categoryRows = parseCsvRows(
    typeof files?.["foodCategoryCsv"] === "string" ? files["foodCategoryCsv"] : "",
  );
  const categories = new Map(
    categoryRows
      .map((row) => [row["id"], row["description"]] as const)
      .filter(([id, description]) => Boolean(id && description)),
  );
  const nutrientsByFood = new Map<string, Map<number, number>>();
  for (const row of nutrientRows) {
    const fdcId = row["fdc_id"]?.trim();
    const nutrientId = Number(row["nutrient_id"]);
    const amount = toNumber(row["amount"]);
    if (!fdcId || !Number.isInteger(nutrientId) || amount === null) continue;
    const nutrients = nutrientsByFood.get(fdcId) ?? new Map<number, number>();
    nutrients.set(nutrientId, amount);
    nutrientsByFood.set(fdcId, nutrients);
  }
  const portionsByFood = new Map<string, NonNullable<ImportedFoodRecord["portions"]>>();
  for (const row of portionRows) {
    const fdcId = row["fdc_id"]?.trim();
    const grams = toNumber(row["gram_weight"]);
    if (!fdcId || grams === null || grams <= 0) continue;
    const portions = portionsByFood.get(fdcId) ?? [];
    portions.push({
      name: firstNonEmpty(row["modifier"], row["unit_name"]) ?? "serving",
      amount: toNumber(row["amount"]) ?? 1,
      unit: firstNonEmpty(row["unit_name"]) ?? "serving",
      gramWeight: grams,
    });
    portionsByFood.set(fdcId, portions);
  }

  return foodRows.flatMap((row) => {
    const id = row["fdc_id"]?.trim();
    const sourceName = row["description"]?.trim();
    if (!id || !sourceName) return [];
    const display = canonicalFdcName(sourceName);
    const nutrients = nutrientsByFood.get(id) ?? new Map<number, number>();
    const dataType = row["data_type"]?.toLowerCase() ?? "";
    return [
      {
        externalId: id,
        name: display.name,
        type: dataType === "branded" ? "branded" : "generic",
        category:
          categories.get(row["food_category_id"] ?? "") ?? nonEmpty(row["branded_food_category"]),
        brand: firstNonEmpty(row["brand_owner"], row["brand_name"]),
        barcode: nonEmpty(row["gtin_upc"]),
        nutritionPer100g: nutritionFromFdcValues(nutrients),
        sourceType,
        sourceName,
        sourceUrl: `https://fdc.nal.usda.gov/food-details/${id}/nutrients`,
        aliases: display.aliases,
        portions: portionsByFood.get(id) ?? [],
      } satisfies ImportedFoodRecord,
    ];
  });
}

function parseFdcJson(payload: unknown, sourceType: FoodSourceType): ImportedFoodRecord[] {
  const foodsPayload = Array.isArray(payload) ? payload : asRecord(payload)?.["foods"];
  if (!Array.isArray(foodsPayload)) throw new Error("FDC JSON must contain a foods array");
  return foodsPayload.flatMap((value) => {
    const food = asRecord(value);
    if (!food) return [];
    const id = textValue(food["fdcId"]);
    const sourceName = textValue(food["description"]).trim();
    if (!id || !sourceName) return [];
    const display = canonicalFdcName(sourceName);
    const nutrition = readFdcNutrition(food["foodNutrients"]);
    const portions = Array.isArray(food["foodPortions"])
      ? food["foodPortions"].flatMap((portionValue) => {
          const portion = asRecord(portionValue);
          const grams = toNumber(portion?.["gramWeight"]);
          if (!portion || grams === null || grams <= 0) return [];
          const measure = asRecord(portion["measureUnit"]);
          const namePart =
            firstNonEmpty(textValue(portion["modifier"]), textValue(measure?.["name"])) ??
            "serving";
          return [
            {
              name: namePart || "serving",
              gramWeight: grams,
              amount: toNumber(portion["amount"]) ?? 1,
              unit: textValue(measure?.["name"]) || "serving",
            },
          ];
        })
      : [];
    const fdcType = textValue(food["dataType"]).toLowerCase();
    return [
      {
        externalId: id,
        name: display.name,
        type: fdcType === "branded" ? "branded" : "generic",
        category: nonEmpty(food["foodCategory"]),
        brand: firstNonEmpty(textValue(food["brandOwner"]), textValue(food["brandName"])),
        nutritionPer100g: nutrition,
        sourceType,
        sourceName,
        sourceUrl: `https://fdc.nal.usda.gov/food-details/${id}/nutrients`,
        aliases: display.aliases,
        portions,
      } satisfies ImportedFoodRecord,
    ];
  });
}

function parseOffProduct(value: unknown): ImportedFoodRecord[] {
  const product = asRecord(value);
  if (!product) return [];
  const id = textValue(product["code"]).trim();
  const name = firstNonEmpty(
    textValue(product["product_name_it"]),
    textValue(product["product_name"]),
  );
  const nutriments = asRecord(product["nutriments"]);
  if (!id || !name || !nutriments) return [];
  const servingGrams = toNumber(product["serving_quantity"]);
  return [
    {
      externalId: id,
      name,
      type: "branded",
      brand: nonEmpty(product["brands"]),
      barcode: id,
      nutritionPer100g: {
        energyKcal: readNumber(nutriments, "energy-kcal_100g"),
        proteinG: readNumber(nutriments, "proteins_100g"),
        carbohydratesG: readNumber(nutriments, "carbohydrates_100g"),
        fatG: readNumber(nutriments, "fat_100g"),
        fiberG: readNumber(nutriments, "fiber_100g"),
        sugarG: readNumber(nutriments, "sugars_100g"),
        saturatedFatG: readNumber(nutriments, "saturated-fat_100g"),
        sodiumMg: readNumber(nutriments, "sodium_100g", 1000),
      },
      sourceType: "OPEN_FOOD_FACTS",
      sourceName: name,
      sourceUrl: `https://world.openfoodfacts.org/product/${id}`,
      portions:
        servingGrams && servingGrams > 0 ? [{ name: "serving", gramWeight: servingGrams }] : [],
    },
  ];
}

function parseSimpleCsvRow(row: unknown, sourceType: FoodSourceType): ImportedFoodRecord[] {
  const value = asRecord(row);
  if (!value) return [];
  const name = textValue(value["name"]).trim();
  const externalId = firstNonEmpty(textValue(value["source_id"]), textValue(value["external_id"]));
  if (!name || !externalId) return [];
  const number = (key: string) => toNumber(value[key]);
  return [
    {
      externalId,
      name,
      type: asFoodType(value["type"]),
      category: nonEmpty(value["category"]),
      brand: nonEmpty(value["brand"]),
      barcode: nonEmpty(value["barcode"]),
      nutritionPer100g: {
        energyKcal: number("energy_kcal_per_100g"),
        proteinG: number("protein_g_per_100g"),
        carbohydratesG: number("carbohydrates_g_per_100g"),
        fatG: number("fat_g_per_100g"),
        fiberG: number("fiber_g_per_100g"),
        sugarG: number("sugar_g_per_100g"),
        saturatedFatG: number("saturated_fat_g_per_100g"),
        sodiumMg: number("sodium_mg_per_100g"),
      },
      sourceType,
      sourceName: nonEmpty(value["source_name"]) ?? name,
      sourceUrl: nonEmpty(value["source_url"]),
      aliases: ["it", "en"].flatMap((locale) => {
        const alias = textValue(value[`alias_${locale}`]).trim();
        return alias ? [{ locale, name: alias }] : [];
      }),
      portions:
        nonEmpty(value["portion_name"]) && toNumber(value["portion_grams"])
          ? [
              {
                name: textValue(value["portion_name"]),
                gramWeight: toNumber(value["portion_grams"]) ?? 100,
              },
            ]
          : [],
    },
  ];
}

async function findSourceFood(db: Database, sourceType: FoodSourceType, sourceId: string) {
  const [row] = await db
    .select()
    .from(foods)
    .where(and(eq(foods.sourceType, sourceType), eq(foods.sourceId, sourceId)));
  return row;
}

async function replaceAliases(
  db: Database,
  foodId: string,
  aliases: { locale: string; name: string }[],
) {
  await db.delete(foodAliases).where(eq(foodAliases.foodId, foodId));
  for (const alias of aliases) {
    await db.insert(foodAliases).values({
      id: crypto.randomUUID(),
      foodId,
      locale: alias.locale,
      name: alias.name,
      normalizedName: normalizeFoodName(alias.name),
    });
  }
}

async function replacePortions(
  db: Database,
  foodId: string,
  portions: ImportedFoodRecord["portions"],
  sourceType: FoodSourceType,
) {
  const validPortions = (portions ?? []).filter(
    (portion) =>
      Number.isFinite(portion.gramWeight) && portion.gramWeight > 0 && (portion.amount ?? 1) > 0,
  );
  await db.delete(foodPortions).where(eq(foodPortions.foodId, foodId));
  for (const [index, portion] of withDefault100gPortion(validPortions).entries()) {
    await db.insert(foodPortions).values({
      id: crypto.randomUUID(),
      foodId,
      name: portion.name,
      amount: portion.amount ?? 1,
      unit: portion.unit ?? "serving",
      gramWeight: portion.gramWeight,
      isDefault: index === 0,
      sourceType,
    });
  }
}

function withDefault100gPortion(
  portions: ImportedFoodRecord["portions"],
): NonNullable<ImportedFoodRecord["portions"]> {
  const current = portions ?? [];
  if (current.some((portion) => portion.gramWeight === 100)) return current;
  return [...current, { name: "100 g", amount: 100, unit: "g", gramWeight: 100 }];
}

function qualityForSource(
  sourceType: FoodSourceType,
): "authoritative" | "branded_label" | "boccone_verified" {
  if (sourceType === "USDA" || sourceType === "CREA") return "authoritative";
  if (sourceType === "BOCCONE_CURATED") return "boccone_verified";
  return "branded_label";
}

function readFdcNutrition(value: unknown): NutritionPer100g {
  const nutrients = Array.isArray(value) ? value : [];
  const find = (ids: number[], names: string[]) => {
    for (const nutrientValue of nutrients) {
      const nutrient = asRecord(nutrientValue);
      const id = Number(nutrient?.["nutrientId"]);
      const name = textValue(nutrient?.["nutrientName"]).toLowerCase();
      if (ids.includes(id) || names.some((part) => name.includes(part)))
        return toNumber(nutrient?.["value"]);
    }
    return null;
  };
  return {
    energyKcal: find([1008, 2047, 2048], ["energy (kcal)", "energy"]),
    proteinG: find([1003], ["protein"]),
    carbohydratesG: find([1005], ["carbohydrate"]),
    fatG: find([1004], ["total lipid"]),
    fiberG: find([1079], ["fiber"]),
    sugarG: find([2000, 1063], ["sugars"]),
    saturatedFatG: find([1258], ["fatty acids, total saturated"]),
    sodiumMg: find([1093], ["sodium"]),
  };
}

function nutritionFromFdcValues(nutrients: Map<number, number>): NutritionPer100g {
  return {
    energyKcal: nutrients.get(1008) ?? nutrients.get(2047) ?? nutrients.get(2048) ?? null,
    proteinG: nutrients.get(1003) ?? null,
    carbohydratesG: nutrients.get(1005) ?? null,
    fatG: nutrients.get(1004) ?? null,
    fiberG: nutrients.get(1079) ?? null,
    sugarG: nutrients.get(2000) ?? nutrients.get(1063) ?? null,
    saturatedFatG: nutrients.get(1258) ?? null,
    sodiumMg: nutrients.get(1093) ?? null,
  };
}

function hasCompleteCoreNutrition(nutrition: NutritionPer100g): boolean {
  return (
    Object.values(nutrition).every((value) => value === null || value >= 0) &&
    nutrition.energyKcal !== null &&
    nutrition.proteinG !== null &&
    nutrition.carbohydratesG !== null &&
    nutrition.fatG !== null
  );
}

/**
 * USDA derived "by difference" nutrients can be slightly negative after
 * rounding. Clamp only those tiny artifacts; larger invalid values skip the
 * record through hasCompleteCoreNutrition instead of entering the catalog.
 */
function sanitizeImportedNutrition(nutrition: NutritionPer100g): NutritionPer100g {
  const sanitize = (value: number | null): number | null =>
    value !== null && value < 0 && value > -1 ? 0 : value;
  return {
    energyKcal: sanitize(nutrition.energyKcal),
    proteinG: sanitize(nutrition.proteinG),
    carbohydratesG: sanitize(nutrition.carbohydratesG),
    fatG: sanitize(nutrition.fatG),
    fiberG: sanitize(nutrition.fiberG),
    sugarG: sanitize(nutrition.sugarG),
    saturatedFatG: sanitize(nutrition.saturatedFatG),
    sodiumMg: sanitize(nutrition.sodiumMg),
  };
}

function readNumber(value: Record<string, unknown>, key: string, multiplier = 1): number | null {
  const number = toNumber(value[key]);
  return number === null ? null : number * multiplier;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value)))
    return Number(value);
  return null;
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function nonEmpty(value: unknown): string | null {
  const text = textValue(value).trim();
  return text ? text : null;
}

function firstNonEmpty(...values: (string | null | undefined)[]): string | null {
  for (const value of values) {
    const text = value?.trim();
    if (text) return text;
  }
  return null;
}

const fdcCategoryPrefixes = new Set([
  "alcoholic beverage",
  "babyfood",
  "beverages",
  "cake",
  "candies",
  "cereals",
  "cereals ready-to-eat",
  "crackers",
  "desserts",
  "fast food",
  "fast foods",
  "frozen novelties",
  "ice creams",
  "infant formula",
  "muffins",
  "puddings",
  "restaurant",
  "salad dressing",
  "sauce",
  "snacks",
  "soup",
  "spices",
  "toppings",
]);

function isFdcCategoryPrefix(value: string): boolean {
  return fdcCategoryPrefixes.has(normalizeFoodName(value));
}

function splitFdcDescription(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let parentheses = 0;
  for (const character of value) {
    if (character === "(") parentheses += 1;
    if (character === ")") parentheses = Math.max(0, parentheses - 1);
    if (character === "," && parentheses === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function canonicalFdcName(sourceName: string): {
  name: string;
  aliases: { locale: string; name: string }[];
} {
  const source = sourceName.trim();
  const sourceParts = splitFdcDescription(source);
  const baseIndex = isFdcCategoryPrefix(sourceParts[0] ?? "") ? 1 : 0;
  const base = sourceParts[baseIndex]?.trim() ?? source;
  const suffixParts = sourceParts.slice(baseIndex + 1).filter(Boolean);
  const baseNormalized = normalizeFoodName(base);
  const aliases = [
    { locale: "en", name: base },
    { locale: "en", name: source },
  ];
  let name = base;

  const translations: Record<string, string> = {
    "alaska pollock": "Pollock d'Alaska",
    "almond butter": "Burro di mandorle",
    "almond milk": "Latte di mandorla",
    anchovies: "Acciughe",
    apple: "Mela",
    "apple juice": "Succo di mela",
    apples: "Mela",
    applesauce: "Composta di mele",
    apricot: "Albicocca",
    arugula: "Rucola",
    asparagus: "Asparagi",
    avocado: "Avocado",
    banana: "Banana",
    bananas: "Banana",
    beans: "Fagioli",
    beef: "Manzo",
    "beet greens": "Foglie di barbabietola",
    beets: "Barbabietole",
    bison: "Bisonte",
    "blackeye pea": "Fagioli dall'occhio",
    blueberries: "Mirtilli",
    bread: "Pane",
    broccoli: "Broccoli",
    "brussels sprouts": "Cavolini di Bruxelles",
    buckwheat: "Grano saraceno",
    bulgur: "Bulgur",
    buttermilk: "Latticello",
    cabbage: "Cavolo",
    carrots: "Carote",
    cauliflower: "Cavolfiore",
    celery: "Sedano",
    cheese: "Formaggio",
    cherries: "Ciliegie",
    "chia seeds": "Semi di chia",
    chicken: "Pollo",
    chickpeas: "Ceci",
    "chickpeas (garbanzo beans": "Ceci",
    cod: "Merluzzo",
    collards: "Cavolo riccio",
    cookies: "Biscotti",
    corn: "Mais",
    "corn flour": "Farina di mais",
    "cottage cheese": "Fiocchi di latte",
    "cranberry juice": "Succo di mirtillo rosso",
    cream: "Panna",
    "cream cheese": "Formaggio cremoso",
    crustaceans: "Crostacei",
    cucumber: "Cetriolo",
    egg: "Uovo",
    eggplant: "Melanzana",
    eggs: "Uovo",
    einkorn: "Farro monococco",
    farro: "Farro",
    fennel: "Finocchio",
    farina: "Farina",
    figs: "Fichi",
    fish: "Pesce",
    flaxseed: "Semi di lino",
    flour: "Farina",
    fonio: "Fonio",
    frankfurter: "Würstel",
    garlic: "Aglio",
    "grape juice": "Succo d'uva",
    "grapefruit juice": "Succo di pompelmo",
    grapes: "Uva",
    halibut: "Halibut",
    ham: "Prosciutto",
    hummus: "Hummus",
    kale: "Cavolo riccio",
    ketchup: "Ketchup",
    khorasan: "Grano khorasan",
    kiwifruit: "Kiwi",
    "kiwifruit (kiwi)": "Kiwi",
    lamb: "Agnello",
    lentils: "Lenticchie",
    lettuce: "Lattuga",
    lobster: "Aragosta",
    "mahi mahi": "Lampuga",
    mandarin: "Mandarino",
    mango: "Mango",
    melons: "Melone",
    millet: "Miglio",
    mushroom: "Fungo",
    mushrooms: "Fungo",
    mustard: "Senape",
    nectarines: "Nettarine",
    nuts: "Frutta secca",
    "oat milk": "Latte d'avena",
    oats: "Avena",
    oil: "Olio",
    olives: "Olive",
    "onion rings": "Anelli di cipolla",
    onions: "Cipolla",
    "orange juice": "Succo d'arancia",
    oranges: "Arancia",
    parsnips: "Pastinaca",
    peaches: "Pesca",
    "peanut butter": "Burro di arachidi",
    peanuts: "Arachidi",
    pear: "Pera",
    pears: "Pera",
    peas: "Piselli",
    peppers: "Peperoni",
    pickles: "Sottaceti",
    pineapple: "Ananas",
    plantains: "Platano",
    plum: "Prugna",
    pork: "Maiale",
    potatoes: "Patata",
    radicchio: "Radicchio",
    radishes: "Ravanelli",
    raspberries: "Lamponi",
    "chicken breast": "Petto di pollo",
    coffee: "Caffè",
    "coffee and cocoa": "Caffè e cacao",
    cocoa: "Cacao",
    mozzarella: "Mozzarella",
    milk: "Latte",
    "olive oil": "Olio d'oliva",
    pasta: "Pasta",
    rice: "Riso",
    sauce: "Salsa",
    sausage: "Salsiccia",
    scallops: "Capesante",
    "sea bass": "Spigola",
    seeds: "Semi",
    "sesame butter": "Tahina",
    snapper: "Dentice",
    "snow crab": "Granchio delle nevi",
    sorghum: "Sorgo",
    "sorghum bran": "Crusca di sorgo",
    "sorghum flour": "Farina di sorgo",
    "sorghum grain": "Chicchi di sorgo",
    "soy milk": "Latte di soia",
    spinach: "Spinaci",
    squash: "Zucca",
    "squid (calamari)": "Calamari",
    strawberries: "Fragole",
    sugars: "Zuccheri",
    "sweet potatoes": "Patata dolce",
    swordfish: "Pesce spada",
    tea: "Tè",
    tomato: "Pomodoro",
    "tomato juice": "Succo di pomodoro",
    tomatoes: "Pomodoro",
    tuna: "Tonno",
    turkey: "Tacchino",
    turnips: "Rapa",
    watermelon: "Anguria",
    "wild rice": "Riso selvatico",
    yogurt: "Yogurt",
  };
  const qualifierTranslations: Record<string, string> = {
    baked: "al forno",
    boiled: "lessato",
    almond: "mandorla",
    "back meat only": "solo carne della schiena",
    breast: "petto",
    "breakfast blend": "miscela colazione",
    "barbecue flavored": "aromatizzato al barbecue",
    "breaded and fried": "impanato e fritto",
    brewed: "preparato",
    canned: "in scatola",
    cooked: "cotto",
    "cooked with water": "cotto con acqua",
    "dehydrated low moisture": "disidratato, a bassa umidità",
    decaffeinated: "decaffeinato",
    dried: "secco",
    dry: "secco",
    enriched: "arricchito",
    espresso: "espresso",
    frozen: "surgelato",
    giblets: "frattaglie",
    grilled: "alla griglia",
    ground: "macinato",
    glazed: "glassato",
    iced: "freddo",
    lean: "magro",
    instant: "istantaneo",
    "low sodium": "a basso contenuto di sodio",
    buckwheat: "grano saraceno",
    barley: "orzo",
    cassava: "manioca",
    chestnut: "castagna",
    coconut: "cocco",
    "meat and skin": "carne e pelle",
    "meat only": "solo carne",
    "half the caffeine": "metà caffeina",
    mocha: "moka",
    "non fat": "senza grassi",
    "prepared with water": "preparato con acqua",
    "prepared with tap water": "preparato con acqua del rubinetto",
    powder: "in polvere",
    peeled: "sbucciato",
    plain: "semplice",
    regular: "classico",
    raw: baseNormalized === "apple" || baseNormalized === "apples" ? "" : "crudo",
    roasted: "arrosto",
    "restaurant prepared": "preparato al ristorante",
    smoked: "affumicato",
    skinless: "senza pelle",
    skin: "pelle",
    "sliced drained heated": "a fette, sgocciolato, riscaldato",
    sliced: "a fette",
    "solids and liquids": "polpa e liquido",
    stewed: "stufato",
    sulfured: "trattato con solfiti",
    sweetened: "zuccherato",
    thigh: "coscia",
    drumstick: "coscia",
    "with added salt": "con sale aggiunto",
    wing: "ala",
    "with chicory": "con cicoria",
    chicory: "cicoria",
    "with water": "con acqua",
    "with whitener": "con crema",
    "with salt": "con sale",
    "with skin": "con buccia",
    "without added sugar": "senza zuccheri aggiunti",
    "without salt": "senza sale",
    "without skin": "senza buccia",
    "ready to drink": "pronto da bere",
    "milk based": "a base di latte",
    unenriched: "non arricchito",
    uncooked: "non cotto",
    "reduced calorie": "a ridotto contenuto calorico",
    grape: "uva",
    "red ripe": "rosso maturo",
    rye: "segale",
    quinoa: "quinoa",
    potato: "patata",
    "rice brown": "riso integrale",
    sorghum: "sorgo",
    "soy defatted": "soia sgrassata",
    "soy full fat": "soia integrale",
    crushed: "schiacciato",
    "sun dried": "secco al sole",
    "packed in oil": "conservato sott'olio",
    whole: "intero",
    "low fat 2 milk": "latte parzialmente scremato",
  };
  const qualifiers = suffixParts
    .map((part) => qualifierTranslations[normalizeFoodName(part)] ?? titleCase(part))
    .filter((part) => part.length > 0);
  if (baseNormalized === "pasta" || baseNormalized === "rice") {
    const italianBase = baseNormalized === "pasta" ? "Pasta" : "Riso";
    const preparation = qualifiers.find((part) => ["cotto", "lessato", "secco"].includes(part));
    name = preparation ? `${italianBase} ${preparation}` : italianBase;
    const descriptors = qualifiers.filter((part) => part !== preparation);
    if (descriptors.length) name += ` · ${descriptors.join(", ")}`;
  } else {
    const translatedBase = translations[baseNormalized];
    if (!translatedBase) name = titleCase(source);
    else {
      const preparation = qualifiers.find((part) =>
        [
          "al forno",
          "alla griglia",
          "arrosto",
          "cotto",
          "cruda",
          "crudo",
          "lessato",
          "secco",
          "sbucciato",
        ].includes(part),
      );
      name = preparation ? `${translatedBase} ${preparation}` : translatedBase;
      const descriptors = qualifiers.filter((part) => part !== preparation);
      if (descriptors.length) name += ` · ${descriptors.join(", ")}`;
    }
  }
  if (name !== base) aliases.push({ locale: "it", name });
  const italianSearchAlternates: Record<string, string[]> = {
    Agnello: ["Agnelli"],
    Albicocca: ["Albicocche"],
    Arancia: ["Arance"],
    Banana: ["Banane"],
    Carota: ["Carote"],
    Caffè: ["Caffè"],
    Formaggio: ["Formaggi"],
    Cece: ["Ceci"],
    Ceci: ["Cece"],
    Ciliegia: ["Ciliegie"],
    Cipolla: ["Cipolle"],
    Fagioli: ["Fagiolo"],
    Farina: ["Farine"],
    Fico: ["Fichi"],
    Fragola: ["Fragole"],
    Fungo: ["Funghi"],
    Lamponi: ["Lampone"],
    Lenticchia: ["Lenticchie"],
    Mela: ["Mele"],
    Melanzana: ["Melanzane"],
    Mirtillo: ["Mirtilli"],
    Manzo: ["Carne di manzo"],
    Maiale: ["Carne di maiale"],
    Nettarina: ["Nettarine"],
    Oliva: ["Olive"],
    Patata: ["Patate"],
    Pesca: ["Pesche"],
    Peperone: ["Peperoni"],
    Pisello: ["Piselli"],
    Pollo: ["Carne di pollo"],
    Pomodoro: ["Pomodori"],
    Ravanello: ["Ravanelli"],
    Spinacio: ["Spinaci"],
    Uovo: ["Uova"],
  };
  const translatedBase = translations[baseNormalized];
  for (const alternate of italianSearchAlternates[translatedBase ?? ""] ?? []) {
    aliases.push({ locale: "it", name: alternate });
    if (translatedBase && name.startsWith(translatedBase)) {
      aliases.push({ locale: "it", name: `${alternate}${name.slice(translatedBase.length)}` });
    }
  }
  return { name, aliases: dedupeAliases(aliases) };
}

function titleCase(value: string): string {
  return value
    .toLocaleLowerCase("en-US")
    .replace(/\b\p{L}/gu, (character) => character.toLocaleUpperCase("en-US"));
}

function dedupeAliases(aliases: { locale: string; name: string }[]) {
  const seen = new Set<string>();
  return aliases.filter((alias) => {
    const key = `${alias.locale}:${normalizeFoodName(alias.name)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function asFoodType(value: unknown): FoodType {
  return value === "branded" || value === "dish" ? value : "generic";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

export function parseCsvRows(contents: string): Record<string, string>[] {
  const rows = contents.split(/\r?\n/).filter((line) => line.trim());
  const headers = parseCsvLine(rows.shift() ?? "").map((header) => header.replace(/^\uFEFF/, ""));
  return rows.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (character === "," && !quoted) {
      result.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  result.push(current);
  return result.map((value) => value.trim());
}
