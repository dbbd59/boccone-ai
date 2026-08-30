import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import {
  adminAuditLogsResponseSchema,
  adminFoodsResponseSchema,
  adminFoodSubmissionResponseSchema,
  adminFoodSubmissionsResponseSchema,
  dailyMealsResponseSchema,
  foodSearchResponseSchema,
  foodSubmissionResponseSchema,
  mealResponseSchema,
  meResponseSchema,
} from "@boccone/contracts";
import { eq, foodAliases, foodPortions, foods, user } from "@boccone/db";

import { importFoodRecords } from "../src/services/food-import";
import { listAdminFoods } from "../src/services/foods";
import { createCookieJar, createTestHarness, uniqueEmail, type TestHarness } from "./helpers";

let harness: TestHarness;

beforeAll(async () => {
  harness = await createTestHarness();
});

afterAll(async () => {
  if (harness) await harness.cleanup();
});

function request(path: string, init: RequestInit = {}): Promise<Response> {
  return harness.app.handle(new Request(`http://localhost${path}`, init));
}

function requestWithCookie(
  path: string,
  jar: ReturnType<typeof createCookieJar>,
  init: RequestInit = {},
) {
  return harness.app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: { ...init.headers, Cookie: jar.header() },
    }),
  );
}

async function signUp(email: string) {
  const jar = createCookieJar();
  const response = await request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Food Tester", email, password: "correct-horse-42" }),
  });
  jar.capture(response);
  expect(response.status).toBe(200);
  return jar;
}

describe("food catalog", () => {
  test("searches local foods, snapshots meal nutrition, and moderates private submissions", async () => {
    const ownerJar = await signUp(uniqueEmail("food-owner"));
    const foodId = crypto.randomUUID();
    await harness.db.insert(foods).values({
      id: foodId,
      name: "Mela",
      normalizedName: "mela",
      type: "generic",
      category: "Frutta",
      brand: null,
      barcode: null,
      energyKcalPer100g: 52,
      proteinGPer100g: 0.3,
      carbohydratesGPer100g: 13.8,
      fatGPer100g: 0.2,
      fiberGPer100g: 2.4,
      sugarGPer100g: 10.4,
      saturatedFatGPer100g: 0,
      sodiumMgPer100g: 1,
      sourceType: "BOCCONE_CURATED",
      sourceId: `test-${foodId}`,
      sourceUrl: null,
      qualityLevel: "boccone_verified",
      status: "APPROVED",
      ownerUserId: null,
      isFeatured: true,
    });
    await harness.db.insert(foodPortions).values({
      id: crypto.randomUUID(),
      foodId,
      name: "1 medium",
      amount: 1,
      unit: "serving",
      gramWeight: 182,
      isDefault: true,
      sourceType: "BOCCONE_CURATED",
    });

    const searchResponse = await requestWithCookie(
      "/api/me/foods/search?query=mela&locale=it",
      ownerJar,
    );
    expect(searchResponse.status).toBe(200);
    const search = foodSearchResponseSchema.parse(await searchResponse.json());
    expect(search.foods[0]).toMatchObject({ id: foodId, name: "Mela" });

    const contextualSearch = foodSearchResponseSchema.parse(
      await (
        await requestWithCookie("/api/me/foods/search?query=mela%20frutto&locale=it", ownerJar)
      ).json(),
    );
    expect(contextualSearch.foods.some((food) => food.id === foodId)).toBe(true);

    const mealResponse = await requestWithCookie("/api/me/meals", ownerJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Fruit snack",
        category: "snack",
        date: "2026-08-29",
        entries: [{ foodId, portionName: "1 medium", quantity: 1, grams: 182 }],
      }),
    });
    expect(mealResponse.status).toBe(200);
    const meal = mealResponseSchema.parse(await mealResponse.json()).meal;
    expect(meal).toMatchObject({ calories: 95, entries: [{ foodId, foodName: "Mela" }] });
    expect(meal.entries[0]?.energyKcal).toBe(94.6);

    await harness.db
      .update(foods)
      .set({ energyKcalPer100g: 1_000, proteinGPer100g: 100 })
      .where(eq(foods.id, foodId));
    const stableDay = dailyMealsResponseSchema.parse(
      await (await requestWithCookie("/api/me/meals?date=2026-08-29", ownerJar)).json(),
    );
    expect(stableDay.totals.calories).toBe(95);
    expect(stableDay.meals[0]?.entries[0]?.energyKcal).toBe(94.6);

    const unchangedUpdate = await requestWithCookie(`/api/me/meals/${meal.id}`, ownerJar, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Fruit snack remembered",
        entries: [
          {
            id: meal.entries[0]?.id,
            foodId,
            portionName: "1 medium",
            quantity: 1,
            grams: 182,
          },
        ],
      }),
    });
    expect(unchangedUpdate.status).toBe(200);
    const unchangedMeal = mealResponseSchema.parse(await unchangedUpdate.json()).meal;
    expect(unchangedMeal.calories).toBe(95);
    expect(unchangedMeal.entries[0]?.energyKcal).toBe(94.6);

    const intentionalChange = await requestWithCookie(`/api/me/meals/${meal.id}`, ownerJar, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        entries: [
          { ...unchangedMeal.entries[0], foodId, portionName: "200 g", quantity: 1, grams: 200 },
        ],
      }),
    });
    expect(intentionalChange.status).toBe(200);
    const changedMeal = mealResponseSchema.parse(await intentionalChange.json()).meal;
    expect(changedMeal.calories).toBe(2_000);
    expect(changedMeal.entries[0]?.energyKcal).toBe(2_000);

    const submissionResponse = await requestWithCookie("/api/me/food-submissions", ownerJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Yogurt locale",
        portionName: "1 cup",
        portionGrams: 125,
        nutritionPer100g: {
          energyKcal: 70,
          proteinG: 5,
          carbohydratesG: 6,
          fatG: 2,
          fiberG: null,
          sugarG: null,
          saturatedFatG: null,
          sodiumMg: null,
        },
      }),
    });
    expect(submissionResponse.status).toBe(200);
    const submitted = foodSubmissionResponseSchema.parse(await submissionResponse.json());
    expect(submitted.food).toMatchObject({
      name: "Yogurt locale",
      isPrivate: true,
      status: "PENDING_REVIEW",
    });

    const otherJar = await signUp(uniqueEmail("food-other"));
    const otherSearch = foodSearchResponseSchema.parse(
      await (await requestWithCookie("/api/me/foods/search?query=yogurt", otherJar)).json(),
    );
    expect(otherSearch.foods.some((food) => food.id === submitted.food.id)).toBe(false);
    expect((await requestWithCookie("/api/admin/food-submissions", ownerJar)).status).toBe(403);

    const adminJar = await signUp(uniqueEmail("food-admin"));
    const admin = meResponseSchema.parse(
      await (await requestWithCookie("/api/me", adminJar)).json(),
    ).user;
    await harness.db.update(user).set({ role: "admin" }).where(eq(user.id, admin.id));
    const adminFoodsResponse = await requestWithCookie(
      "/api/admin/foods?limit=20&offset=0",
      adminJar,
    );
    expect(adminFoodsResponse.status).toBe(200);
    expect(
      adminFoodsResponseSchema.parse(await adminFoodsResponse.json()).foods.length,
    ).toBeLessThanOrEqual(20);
    const pending = adminFoodSubmissionsResponseSchema.parse(
      await (await requestWithCookie("/api/admin/food-submissions", adminJar)).json(),
    );
    expect(pending.submissions.some((item) => item.id === submitted.submission.id)).toBe(true);

    const editResponse = await requestWithCookie(
      `/api/admin/foods/${submitted.food.id}`,
      adminJar,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Yogurt locale edited",
          portions: [
            { name: "1 cup", amount: 1, unit: "serving", gramWeight: 125, isDefault: true },
          ],
        }),
      },
    );
    expect(editResponse.status).toBe(200);

    const approvalResponse = await requestWithCookie(
      `/api/admin/food-submissions/${submitted.submission.id}/approve`,
      adminJar,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    expect(approvalResponse.status).toBe(200);
    const approved = adminFoodSubmissionResponseSchema.parse(await approvalResponse.json());
    expect(approved.submission.status).toBe("APPROVED");
    expect(approved.submission.food.name).toBe("Yogurt locale edited");

    const approvedSearch = foodSearchResponseSchema.parse(
      await (await requestWithCookie("/api/me/foods/search?query=yogurt", otherJar)).json(),
    );
    expect(approvedSearch.foods.some((food) => food.id === submitted.food.id)).toBe(true);

    const duplicateSubmission = await requestWithCookie("/api/me/food-submissions", ownerJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Mela",
        portionName: "1 medium",
        portionGrams: 182,
        nutritionPer100g: {
          energyKcal: 52,
          proteinG: 0.3,
          carbohydratesG: 13.8,
          fatG: 0.2,
          fiberG: null,
          sugarG: null,
          saturatedFatG: null,
          sodiumMg: null,
        },
      }),
    });
    expect(duplicateSubmission.status).toBe(409);

    const rejectedResponse = await requestWithCookie("/api/me/food-submissions", ownerJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Rejected food",
        portionName: "1 serving",
        portionGrams: 100,
        nutritionPer100g: {
          energyKcal: 10,
          proteinG: 1,
          carbohydratesG: 1,
          fatG: 1,
          fiberG: null,
          sugarG: null,
          saturatedFatG: null,
          sodiumMg: null,
        },
      }),
    });
    expect(rejectedResponse.status).toBe(200);
    const rejected = foodSubmissionResponseSchema.parse(await rejectedResponse.json());
    const rejectAction = await requestWithCookie(
      `/api/admin/food-submissions/${rejected.submission.id}/reject`,
      adminJar,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Duplicate label" }),
      },
    );
    expect(rejectAction.status).toBe(200);
    expect(
      adminFoodSubmissionResponseSchema.parse(await rejectAction.json()).submission.status,
    ).toBe("REJECTED");
    const rejectedOwnerSearch = foodSearchResponseSchema.parse(
      await (await requestWithCookie("/api/me/foods/search?query=rejected", ownerJar)).json(),
    );
    expect(rejectedOwnerSearch.foods.some((food) => food.id === rejected.food.id)).toBe(true);

    const mergedResponse = await requestWithCookie("/api/me/food-submissions", ownerJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Mela alternativa",
        portionName: "1 serving",
        portionGrams: 100,
        nutritionPer100g: {
          energyKcal: 52,
          proteinG: 0.3,
          carbohydratesG: 13.8,
          fatG: 0.2,
          fiberG: null,
          sugarG: null,
          saturatedFatG: null,
          sodiumMg: null,
        },
      }),
    });
    expect(mergedResponse.status).toBe(200);
    const merged = foodSubmissionResponseSchema.parse(await mergedResponse.json());
    const mergeReview = adminFoodSubmissionResponseSchema.parse(
      await (
        await requestWithCookie(`/api/admin/food-submissions/${merged.submission.id}`, adminJar)
      ).json(),
    );
    expect(mergeReview.submission.possibleDuplicates.some((food) => food.id === foodId)).toBe(true);
    const mergeAction = await requestWithCookie(
      `/api/admin/food-submissions/${merged.submission.id}/merge`,
      adminJar,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ foodId }),
      },
    );
    expect(mergeAction.status).toBe(200);
    expect(
      adminFoodSubmissionResponseSchema.parse(await mergeAction.json()).submission.status,
    ).toBe("MERGED");
    const mergedAliasSearch = foodSearchResponseSchema.parse(
      await (
        await requestWithCookie("/api/me/foods/search?query=mela%20alternativa", ownerJar)
      ).json(),
    );
    expect(mergedAliasSearch.foods[0]?.id).toBe(foodId);

    const incompleteMealResponse = await requestWithCookie("/api/me/meals", otherJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Yogurt snack",
        category: "snack",
        date: "2026-08-29",
        entries: [{ foodId: submitted.food.id, portionName: "1 cup", quantity: 1, grams: 125 }],
      }),
    });
    const incompleteMeal = mealResponseSchema.parse(await incompleteMealResponse.json()).meal;
    expect(incompleteMeal.nutritionIncomplete).toBe(true);
    const incompleteDay = await requestWithCookie("/api/me/meals?date=2026-08-29", otherJar);
    expect(dailyMealsResponseSchema.parse(await incompleteDay.json()).nutritionIncomplete).toBe(
      true,
    );

    const audit = adminAuditLogsResponseSchema.parse(
      await (await requestWithCookie("/api/admin/audit-logs?limit=20", adminJar)).json(),
    );
    expect(audit.logs.some((log) => log.action === "food_submission_approved")).toBe(true);

    const importedFoodId = crypto.randomUUID();
    const importSummary = await importFoodRecords(harness.db, [
      {
        externalId: importedFoodId,
        name: "Riso cotto",
        type: "generic",
        nutritionPer100g: {
          energyKcal: 130,
          proteinG: 2.7,
          carbohydratesG: 28,
          fatG: 0.3,
          fiberG: null,
          sugarG: null,
          saturatedFatG: null,
          sodiumMg: null,
        },
        sourceType: "USDA",
        sourceName: "Rice, white, long-grain, regular, cooked",
        portions: [],
      },
    ]);
    expect(importSummary.inserted).toBe(1);
    const [importedFood] = await harness.db
      .select()
      .from(foods)
      .where(eq(foods.sourceId, importedFoodId));
    expect(importedFood).toBeDefined();
    const importedPortions = await harness.db
      .select()
      .from(foodPortions)
      .where(eq(foodPortions.foodId, importedFood?.id ?? ""));
    expect(importedPortions).toMatchObject([{ name: "100 g", gramWeight: 100, isDefault: true }]);

    const incompleteImport = await importFoodRecords(harness.db, [
      {
        externalId: crypto.randomUUID(),
        name: "Incomplete source record",
        type: "generic",
        nutritionPer100g: {
          energyKcal: 20,
          proteinG: null,
          carbohydratesG: 2,
          fatG: 0,
          fiberG: null,
          sugarG: null,
          saturatedFatG: null,
          sodiumMg: null,
        },
        sourceType: "USDA",
      },
    ]);
    expect(incompleteImport.skipped).toBe(1);

    const roundingArtifactImport = await importFoodRecords(harness.db, [
      {
        externalId: crypto.randomUUID(),
        name: "Rounding artifact food",
        type: "generic",
        nutritionPer100g: {
          energyKcal: 100,
          proteinG: 10,
          carbohydratesG: -0.25,
          fatG: 2,
          fiberG: null,
          sugarG: null,
          saturatedFatG: null,
          sodiumMg: null,
        },
        sourceType: "USDA",
        portions: [{ name: "invalid", amount: 0, gramWeight: 1 }],
      },
    ]);
    expect(roundingArtifactImport.inserted).toBe(1);
    const adminCatalog = await listAdminFoods(harness.db, { limit: 20, offset: 0 });
    expect(adminCatalog.total).toBeGreaterThan(0);

    const coffeeId = crypto.randomUUID();
    const caffeineId = crypto.randomUUID();
    await harness.db.insert(foods).values([
      {
        id: coffeeId,
        name: "Caffè",
        normalizedName: "caffe",
        type: "generic",
        category: "Bevande",
        brand: null,
        barcode: null,
        energyKcalPer100g: 1,
        proteinGPer100g: 0,
        carbohydratesGPer100g: 0,
        fatGPer100g: 0,
        fiberGPer100g: null,
        sugarGPer100g: null,
        saturatedFatGPer100g: null,
        sodiumMgPer100g: null,
        sourceType: "BOCCONE_CURATED",
        sourceId: `test-${coffeeId}`,
        sourceUrl: null,
        qualityLevel: "boccone_verified",
        status: "APPROVED",
        ownerUserId: null,
        isFeatured: false,
      },
      {
        id: caffeineId,
        name: "Beverages, Cola, Caffeine Free",
        normalizedName: "beverages cola caffeine free",
        type: "generic",
        category: "Bevande",
        brand: null,
        barcode: null,
        energyKcalPer100g: 1,
        proteinGPer100g: 0,
        carbohydratesGPer100g: 0,
        fatGPer100g: 0,
        fiberGPer100g: null,
        sugarGPer100g: null,
        saturatedFatGPer100g: null,
        sodiumMgPer100g: null,
        sourceType: "BOCCONE_CURATED",
        sourceId: `test-${caffeineId}`,
        sourceUrl: null,
        qualityLevel: "boccone_verified",
        status: "APPROVED",
        ownerUserId: null,
        isFeatured: false,
      },
    ]);
    await harness.db.insert(foodAliases).values({
      id: crypto.randomUUID(),
      foodId: caffeineId,
      locale: "en",
      name: "Caffeine",
      normalizedName: "caffeine",
    });
    const coffeeSearchResponse = await requestWithCookie(
      "/api/me/foods/search?query=caffè&locale=it&limit=20",
      ownerJar,
    );
    expect(coffeeSearchResponse.status).toBe(200);
    const coffeeSearch = foodSearchResponseSchema.parse(await coffeeSearchResponse.json());
    expect(coffeeSearch.foods[0]?.id).toBe(coffeeId);
    expect(coffeeSearch.foods.some((food) => food.id === caffeineId)).toBe(false);
  });
});
