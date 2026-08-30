# Food catalog

Boccone keeps food search local. Search-as-you-type never calls USDA or Open Food Facts. External data is downloaded by an operator, imported into PostgreSQL, and searched through the local catalog.

## Sources

| Source                                                                                              | Use                                          | Import status                                      |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| [USDA FoodData Central downloads](https://fdc.nal.usda.gov/download-datasets/)                      | Primary generic and branded nutrition source | Supported: JSON and extracted CSV                  |
| [Open Food Facts data exports](https://world.openfoodfacts.org/data)                                | Packaged-food barcodes and labels            | Supported: JSONL                                   |
| [CREA food composition tables](https://www.crea.gov.it/en/-/tabella-di-composizione-degli-alimenti) | Italian reference for future curated data    | Do not bulk-import until reuse terms are confirmed |

USDA data is public domain under CC0, with attribution requested by USDA. Open Food Facts data has database/content licensing and attribution/share-alike obligations; keep source provenance and review redistribution implications before publishing a combined export. Source URLs remain on every imported food.

## USDA CSV import

1. Open the USDA download page and download a CSV release.
2. Extract the archive into the ignored local directory `apps/api/data/food-exports/fdc/`.
3. Apply the database migration.
4. Import the extracted `food.csv`, `food_nutrient.csv`, `food_portion.csv`, and optional `food_category.csv` files:

```bash
bun run db:migrate
cd apps/api
bun run food:import -- data/food-exports/fdc fdc-csv USDA
```

The importer maps USDA nutrient IDs to the normalized per-100 g contract, imports gram-weight portions, adds a canonical `100 g` fallback when the export has no such portion, and marks USDA records as authoritative. Records missing one of the four core values (kcal, protein, carbohydrates, fat) are skipped instead of becoming misleading zero-valued meals. Common USDA descriptions receive reviewed Italian display names while the original description stays in `sourceName`; preparation qualifiers such as dry/cooked remain meaningful. Re-running the command is safe: `(source_type, source_id)` is the stable identity, so rows update instead of duplicating.

USDA JSON exports are also accepted:

```bash
cd apps/api
bun run food:download -- <official-export-url> data/food-exports/fdc.json
bun run food:import -- data/food-exports/fdc.json fdc-json USDA
```

`food:download` only downloads the file. It does not call a provider during app usage and does not require an API key.
If the official release is compressed, extract it before import; the CSV importer expects the extracted files, and the JSONL importer expects plain text JSONL.

For a broad generic-food catalog, the USDA SR Legacy CSV release is also supported:

```bash
cd apps/api
bun run food:download -- https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip data/food-exports/fdc-sr-legacy-2018-04.zip
unzip -q data/food-exports/fdc-sr-legacy-2018-04.zip -d data/food-exports
bun run food:import -- data/food-exports/FoodData_Central_sr_legacy_food_csv_2018-04 fdc-csv USDA
```

This release is useful alongside Foundation Foods: it adds a wider set of generic ingredients and preparations. The importer keeps the USDA description as provenance, creates reviewed Italian display names and aliases, and replaces imported aliases and portions on re-run so stale or invalid rows do not accumulate.

## Open Food Facts import

Download an official JSONL export, then import it locally:

```bash
cd apps/api
bun run food:download -- <official-export-url> data/food-exports/off.jsonl
bun run food:import -- data/food-exports/off.jsonl off-jsonl OPEN_FOOD_FACTS
```

Open Food Facts records are branded foods. Their barcode, serving quantity, product URL, and label-derived nutrients remain traceable. Treat missing or questionable values as review work; the source itself does not guarantee product accuracy.

## Runtime model

- `foods` stores canonical names, aliases, per-100 g nutrients, provenance, quality, visibility, and moderation state.
- `food_portions` stores gram weights. Nutrition is calculated as `per100g × grams / 100`.
- Unknown nutrient fields stay `null`; food-backed meals expose `nutritionIncomplete` so partial data is visibly marked instead of being presented as complete.
- Users see approved catalog foods plus their own private submissions.
- A missing food creates a private `PENDING_REVIEW` food immediately usable by its submitter.
- Admin approval, rejection, and merge actions are audited. Rejected private foods stay available to their owner.
- `meal_food_entries` stores food name, portion, quantity, grams, and nutrient snapshots. Later catalog edits do not rewrite historical meals.

Food exports stay outside Git because they are large and source-specific. Keep import code, migration, and this document versioned; keep downloaded files under `apps/api/data/food-exports/`.
