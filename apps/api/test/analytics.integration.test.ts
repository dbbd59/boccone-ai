import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import {
  aiUsage,
  dailyTargets,
  eq,
  foodSubmissions,
  foods,
  mealFoodEntries,
  meals,
  user,
} from "@boccone/db";

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
): Promise<Response> {
  return harness.app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: { ...init.headers, Cookie: jar.header() },
    }),
  );
}

async function signUp(name: string) {
  const jar = createCookieJar();
  const email = uniqueEmail(name.toLowerCase().replace(/\s+/g, "-"));
  const response = await request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password: "test-password-42" }),
  });
  jar.capture(response);
  expect(response.status).toBe(200);
  const [account] = await harness.db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email));
  if (!account) throw new Error("test user was not created");
  return { jar, userId: account.id };
}

describe("personal insights", () => {
  test("calculates logged-day averages without turning missing days into zero", async () => {
    const { jar, userId } = await signUp("Analytics User");
    await harness.db.insert(meals).values([
      {
        id: crypto.randomUUID(),
        userId,
        name: "Monday meal",
        category: "lunch",
        mealDate: "2026-08-24",
        calories: 1000,
        proteinGrams: 80,
        carbohydratesGrams: 100,
        fatGrams: 30,
      },
      {
        id: crypto.randomUUID(),
        userId,
        name: "Wednesday meal",
        category: "dinner",
        mealDate: "2026-08-26",
        calories: 2000,
        proteinGrams: 120,
        carbohydratesGrams: 200,
        fatGrams: 70,
      },
    ]);
    await harness.db.insert(dailyTargets).values({ userId, calories: 1800 });

    const response = await requestWithCookie("/api/me/insights?range=7d&today=2026-08-30", jar);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      summary: {
        calories: { current: number | null; currentTotal: number | null };
        proteinGrams: { current: number | null };
        carbohydratesGrams: { current: number | null };
        fatGrams: { current: number | null };
        loggedDays: { current: number | null };
      };
      buckets: { start: string; calories: number | null; logged: boolean }[];
      mealTypes: { category: string; meals: number; calorieShare: number }[];
      targetCalories: number | null;
    };
    expect(body.summary.calories.current).toBe(1500);
    expect(body.summary.calories.currentTotal).toBe(3000);
    expect(body.summary.proteinGrams.current).toBe(100);
    expect(body.summary.carbohydratesGrams.current).toBe(150);
    expect(body.summary.fatGrams.current).toBe(50);
    expect(body.summary.loggedDays.current).toBe(2);
    expect(body.targetCalories).toBe(1800);
    expect(body.mealTypes[0]).toMatchObject({
      category: "dinner",
      meals: 1,
      calorieShare: 2 / 3,
    });
    expect(body.mealTypes[1]).toMatchObject({
      category: "lunch",
      meals: 1,
      calorieShare: 1 / 3,
    });
    expect(body.buckets).toHaveLength(7);
    expect(body.buckets.find((bucket) => bucket.start === "2026-08-25")).toMatchObject({
      calories: null,
      logged: false,
    });

    const longRangeResponse = await requestWithCookie(
      "/api/me/insights?range=3m&today=2026-08-30",
      jar,
    );
    const longRangeBody = (await longRangeResponse.json()) as {
      buckets: { start: string; calories: number | null; loggedDays: number; logged: boolean }[];
    };
    expect(longRangeResponse.status).toBe(200);
    const weeklyBucket = longRangeBody.buckets.find((bucket) => bucket.start === "2026-08-24");
    expect(weeklyBucket).toBeDefined();
    expect(weeklyBucket?.calories).toBe(1500);
    expect(weeklyBucket?.loggedDays).toBe(2);
    expect(weeklyBucket?.logged).toBe(true);
  });

  test("returns food-backed contributors ranked by real snapshot calories", async () => {
    const { jar, userId } = await signUp("Food Analytics User");
    const foodId = crypto.randomUUID();
    const mealId = crypto.randomUUID();
    await harness.db.insert(foods).values({
      id: foodId,
      name: "Test oats",
      normalizedName: "test oats",
      type: "generic",
      sourceType: "BOCCONE_CURATED",
      qualityLevel: "boccone_verified",
      status: "APPROVED",
      energyKcalPer100g: 380,
      proteinGPer100g: 13,
      carbohydratesGPer100g: 68,
      fatGPer100g: 7,
    });
    await harness.db.insert(meals).values({
      id: mealId,
      userId,
      name: "Oats breakfast",
      category: "breakfast",
      mealDate: "2026-08-30",
      calories: 380,
      proteinGrams: 13,
      carbohydratesGrams: 68,
      fatGrams: 7,
    });
    await harness.db.insert(mealFoodEntries).values({
      id: crypto.randomUUID(),
      mealId,
      foodId,
      foodNameSnapshot: "Test oats",
      portionNameSnapshot: "100 g",
      quantity: 1,
      grams: 100,
      energyKcalSnapshot: 380,
      proteinGSnapshot: 13,
      carbohydratesGSnapshot: 68,
      fatGSnapshot: 7,
    });

    const response = await requestWithCookie("/api/me/insights?range=7d&today=2026-08-30", jar);
    const body = (await response.json()) as {
      topFoods: { foodId: string; calories: number | null }[];
    };
    expect(response.status).toBe(200);
    expect(body.topFoods[0]).toMatchObject({ foodId, calories: 380 });

    const diary = await requestWithCookie(`/api/me/diary?before=2026-08-31&foodId=${foodId}`, jar);
    expect(diary.status).toBe(200);
    expect(await diary.json()).toMatchObject({
      days: [{ date: "2026-08-30", meals: [{ id: mealId }] }],
    });
  });
});

describe("admin analytics authorization and aggregation", () => {
  test("requires admin access and aggregates platform activity over the requested dates", async () => {
    const normal = await signUp("Normal Analytics User");
    const unauthenticated = await request("/api/admin/analytics/overview?range=7d");
    expect(unauthenticated.status).toBe(401);
    const forbidden = await requestWithCookie("/api/admin/analytics/overview?range=7d", normal.jar);
    expect(forbidden.status).toBe(403);

    await harness.db.update(user).set({ role: "admin" }).where(eq(user.id, normal.userId));
    await harness.db
      .update(user)
      .set({ createdAt: new Date("2026-08-29T12:00:00.000Z") })
      .where(eq(user.id, normal.userId));
    const adminFoodId = crypto.randomUUID();
    await harness.db.insert(foods).values({
      id: adminFoodId,
      name: "Admin catalog food",
      normalizedName: "admin catalog food",
      type: "generic",
      sourceType: "BOCCONE_CURATED",
      qualityLevel: "boccone_verified",
      status: "APPROVED",
      createdAt: new Date("2026-08-29T12:00:00.000Z"),
    });
    await harness.db.insert(foodSubmissions).values({
      id: crypto.randomUUID(),
      foodId: adminFoodId,
      submittedBy: normal.userId,
      status: "APPROVED",
      reviewedBy: normal.userId,
      reviewedAt: new Date("2026-08-29T14:00:00.000Z"),
      createdAt: new Date("2026-08-29T12:00:00.000Z"),
    });
    await harness.db.insert(aiUsage).values({
      id: crypto.randomUUID(),
      userId: normal.userId,
      feature: "meal_parse",
      provider: "test",
      model: "test-model",
      inputTokens: 100,
      outputTokens: 40,
      totalTokens: 140,
      latencyMs: 250,
      status: "succeeded",
      createdAt: new Date("2026-08-29T13:00:00.000Z"),
    });
    await harness.db.insert(meals).values({
      id: crypto.randomUUID(),
      userId: normal.userId,
      name: "Admin-visible meal",
      category: "lunch",
      mealDate: "2026-08-29",
      calories: 700,
      proteinGrams: 40,
      carbohydratesGrams: 80,
      fatGrams: 20,
    });
    const response = await requestWithCookie(
      "/api/admin/analytics/overview?range=custom&from=2026-08-24&to=2026-08-30",
      normal.jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      period: { timezone: string; days: number };
      kpis: {
        meals: { current: number };
        activeUsers: { current: number };
        newUsers: { current: number };
        foodSubmissions: { current: number };
        aiRequests: { current: number };
      };
      activity: { start: string; newUsers: number }[];
    };
    expect(body.period).toMatchObject({ timezone: "UTC", days: 7 });
    expect(body.kpis.meals.current).toBeGreaterThanOrEqual(1);
    expect(body.kpis.activeUsers.current).toBeGreaterThanOrEqual(1);
    expect(body.kpis.newUsers.current).toBeGreaterThanOrEqual(1);
    expect(body.kpis.foodSubmissions.current).toBeGreaterThanOrEqual(1);
    expect(body.kpis.aiRequests.current).toBeGreaterThanOrEqual(1);
    expect(
      body.activity.find((bucket) => bucket.start === "2026-08-29")?.newUsers,
    ).toBeGreaterThanOrEqual(1);

    const detail = await requestWithCookie(
      "/api/me/insights/nutrition?range=7d&today=2026-08-30&metric=protein",
      normal.jar,
    );
    expect(detail.status).toBe(200);
    const detailBody = (await detail.json()) as {
      metric: string;
      average: number | null;
      buckets: { start: string; value: number | null; loggedDays: number }[];
    };
    expect(detailBody).toMatchObject({ metric: "protein", average: 40 });
    expect(detailBody.buckets.find((bucket) => bucket.start === "2026-08-29")).toMatchObject({
      value: 40,
      loggedDays: 1,
    });

    for (const endpoint of ["nutrition", "foods", "ai"]) {
      const analytics = await requestWithCookie(
        `/api/admin/analytics/${endpoint}?range=custom&from=2026-08-24&to=2026-08-30`,
        normal.jar,
      );
      expect(analytics.status).toBe(200);
      if (endpoint === "nutrition") {
        const nutrition = (await analytics.json()) as {
          mealTypes: { category: string; calories: number; calorieShare: number }[];
        };
        const lunch = nutrition.mealTypes.find((item) => item.category === "lunch");
        expect(lunch?.calories).toBeGreaterThanOrEqual(700);
        expect(lunch?.calorieShare).toBeGreaterThan(0);
      }
      if (endpoint === "foods") {
        const catalog = (await analytics.json()) as {
          moderation: { approved: number; averageReviewHours: number | null };
        };
        expect(catalog.moderation.approved).toBeGreaterThanOrEqual(1);
        expect(catalog.moderation.averageReviewHours).toBe(2);
      }
      if (endpoint === "ai") {
        const ai = (await analytics.json()) as {
          summary: { requests: { current: number }; succeeded: { current: number } };
        };
        expect(ai.summary.requests.current).toBeGreaterThanOrEqual(1);
        expect(ai.summary.succeeded.current).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
