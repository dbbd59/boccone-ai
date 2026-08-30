import type { FoodSourceType } from "@boccone/contracts";
import { closeDb, createDb } from "@boccone/db";

import { loadConfig } from "../config/env";
import { importFoodRecords, parseCsvRows, parseFoodExport } from "../services/food-import";

const [input, format = "fdc-json", source = "USDA"] = Bun.argv.slice(2);
if (!input) {
  console.error(
    "Usage: bun src/scripts/import-food-data.ts <file-or-directory> [fdc-json|fdc-csv|off-jsonl|simple-csv] [source]",
  );
  process.exit(1);
}
const formats = new Set(["fdc-json", "fdc-csv", "off-jsonl", "simple-csv"]);
const sourceTypes = new Set<FoodSourceType>([
  "USDA",
  "OPEN_FOOD_FACTS",
  "CREA",
  "BOCCONE_CURATED",
  "USER_SUBMITTED",
  "AI_ESTIMATE",
]);
if (!formats.has(format)) throw new Error(`Unsupported food export format: ${format}`);
if (!sourceTypes.has(source as FoodSourceType))
  throw new Error(`Unsupported food source: ${source}`);

const config = loadConfig();
const db = createDb({ connectionString: config.databaseUrl });
try {
  const payload = await readPayload(input, format);
  const summary = await importFoodRecords(
    db,
    parseFoodExport(
      payload,
      format as "fdc-json" | "fdc-csv" | "off-jsonl" | "simple-csv",
      source as FoodSourceType,
    ),
  );
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await closeDb(db);
}

async function readPayload(inputPath: string, formatValue: string): Promise<unknown> {
  if (formatValue === "fdc-csv") {
    const read = async (name: string, required = false) => {
      const path = `${inputPath.replace(/\/$/, "")}/${name}`;
      try {
        return await Bun.file(path).text();
      } catch (error) {
        if (required) throw error;
        return "";
      }
    };
    return {
      foodCsv: await read("food.csv", true),
      foodNutrientCsv: await read("food_nutrient.csv", true),
      foodPortionCsv: await read("food_portion.csv"),
      foodCategoryCsv: await read("food_category.csv"),
    };
  }

  const contents = await Bun.file(inputPath).text();
  if (formatValue === "off-jsonl") {
    return contents
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown);
  }
  if (formatValue === "simple-csv") return parseCsvRows(contents);
  return JSON.parse(contents) as unknown;
}
