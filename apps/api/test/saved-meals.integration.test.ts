import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { savedMealResponseSchema, savedMealsResponseSchema } from "@boccone/contracts";

import { createCookieJar, createTestHarness, uniqueEmail, type TestHarness } from "./helpers";

let harness: TestHarness;

beforeAll(async () => {
  harness = await createTestHarness();
});

afterAll(async () => {
  if (harness) await harness.cleanup();
});

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

async function signUpAndSignIn(email: string, password = "correct-horse-42", name = "Test User") {
  const jar = createCookieJar();
  const signUpResponse = await harness.app.handle(
    new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }),
  );
  jar.capture(signUpResponse);
  expect(signUpResponse.status).toBe(200);
  return jar;
}

interface SeedFood {
  id: string;
  name: string;
}

/** Insert a minimal APPROVED catalog food directly so tests can reference it. */
async function seedFood(seed: SeedFood): Promise<void> {
  await harness.db.$client.unsafe(
    `INSERT INTO foods (id, name, normalized_name, type, source_type, quality_level, status)
     VALUES ($1, $2, $2, 'generic', 'BOCCONE_CURATED', 'boccone_verified', 'APPROVED')
     ON CONFLICT (id) DO NOTHING`,
    [seed.id, seed.name],
  );
}

const WORK_BREAKFAST = {
  name: "Colazione ufficio",
  defaultCategory: "breakfast" as const,
  items: [
    { foodId: "food-cappuccino", portionName: "1 tazza", quantity: 1, grams: 150 },
    { foodId: "food-fette", portionName: "1 fetta", quantity: 3, grams: 45 },
  ],
  routine: {
    weekdays: [0, 1, 2, 3, 4],
    localTime: "08:00",
    isReminderEnabled: false,
  },
};

describe("saved meals", () => {
  let userAJar: ReturnType<typeof createCookieJar>;
  let userBJar: ReturnType<typeof createCookieJar>;
  let userAEmail: string;

  beforeAll(async () => {
    await seedFood({ id: "food-cappuccino", name: "Cappuccino" });
    await seedFood({ id: "food-fette", name: "Fette biscottate" });
    userAEmail = uniqueEmail("saved-a");
    userAJar = await signUpAndSignIn(userAEmail);
    userBJar = await signUpAndSignIn(uniqueEmail("saved-b"));
  });

  test("create → list → get round-trips with routine and hydrated names", async () => {
    const created = await requestWithCookie("/api/me/saved-meals", userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(WORK_BREAKFAST),
    });
    expect(created.status).toBe(200);
    const createdBody = savedMealResponseSchema.parse(await created.json());
    expect(createdBody.savedMeal.name).toBe("Colazione ufficio");
    expect(createdBody.savedMeal.items).toHaveLength(2);
    expect(createdBody.savedMeal.items[0]?.foodName).toBe("Cappuccino");
    expect(createdBody.savedMeal.items[0]?.needsAttention).toBe(false);
    expect(createdBody.savedMeal.routine?.localTime).toBe("08:00");
    expect(createdBody.savedMeal.routine?.weekdays).toEqual([0, 1, 2, 3, 4]);

    const list = await requestWithCookie("/api/me/saved-meals", userAJar);
    expect(list.status).toBe(200);
    const listBody = savedMealsResponseSchema.parse(await list.json());
    expect(listBody.savedMeals).toHaveLength(1);

    const fetched = await requestWithCookie(
      `/api/me/saved-meals/${createdBody.savedMeal.id}`,
      userAJar,
    );
    expect(fetched.status).toBe(200);
    const fetchedBody = savedMealResponseSchema.parse(await fetched.json());
    expect(fetchedBody.savedMeal.id).toBe(createdBody.savedMeal.id);
  });

  test("ownership: user B cannot read, update, or delete user A's saved meal", async () => {
    const created = await requestWithCookie("/api/me/saved-meals", userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Solo A", items: WORK_BREAKFAST.items }),
    });
    const mealId = ((await created.json()) as { savedMeal: { id: string } }).savedMeal.id;

    const read = await requestWithCookie(`/api/me/saved-meals/${mealId}`, userBJar);
    expect(read.status).toBe(404);

    const patch = await requestWithCookie(`/api/me/saved-meals/${mealId}`, userBJar, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "hijacked" }),
    });
    expect(patch.status).toBe(404);

    const del = await requestWithCookie(`/api/me/saved-meals/${mealId}`, userBJar, {
      method: "DELETE",
    });
    expect(del.status).toBe(404);

    // A still sees theirs untouched.
    const stillThere = await requestWithCookie(`/api/me/saved-meals/${mealId}`, userAJar);
    expect(stillThere.status).toBe(200);
  });

  test("update replaces items; routine PUT/DELETE preserves the saved meal", async () => {
    const created = await requestWithCookie("/api/me/saved-meals", userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Pranzo", items: WORK_BREAKFAST.items }),
    });
    const mealId = ((await created.json()) as { savedMeal: { id: string } }).savedMeal.id;

    const patched = await requestWithCookie(`/api/me/saved-meals/${mealId}`, userAJar, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Pranzo veloce",
        items: [{ foodId: "food-fette", portionName: "1 fetta", quantity: 2, grams: 30 }],
      }),
    });
    expect(patched.status).toBe(200);
    const patchedBody = savedMealResponseSchema.parse(await patched.json());
    expect(patchedBody.savedMeal.items).toHaveLength(1);
    expect(patchedBody.savedMeal.items[0]?.quantity).toBe(2);

    const routine = await requestWithCookie(`/api/me/saved-meals/${mealId}/routine`, userAJar, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weekdays: [5, 6], localTime: "13:30", isReminderEnabled: true }),
    });
    expect(routine.status).toBe(200);
    const routineBody = savedMealResponseSchema.parse(await routine.json());
    expect(routineBody.savedMeal.routine?.weekdays).toEqual([5, 6]);
    expect(routineBody.savedMeal.routine?.isReminderEnabled).toBe(true);

    const cleared = await requestWithCookie(`/api/me/saved-meals/${mealId}/routine`, userAJar, {
      method: "DELETE",
    });
    expect(cleared.status).toBe(200);
    const clearedBody = savedMealResponseSchema.parse(await cleared.json());
    expect(clearedBody.savedMeal.routine).toBeNull();
    // The saved meal itself survives routine deletion.
    expect(clearedBody.savedMeal.name).toBe("Pranzo veloce");
  });

  test("missing catalog food surfaces needsAttention instead of crashing", async () => {
    const created = await requestWithCookie("/api/me/saved-meals", userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Con fantasma",
        items: [{ foodId: "food-vanished", portionName: "1 pezzo", quantity: 1, grams: 100 }],
      }),
    });
    expect(created.status).toBe(200);
    const body = savedMealResponseSchema.parse(await created.json());
    const item = body.savedMeal.items[0];
    expect(item?.needsAttention).toBe(true);
    expect(item?.foodName).toBe("food-vanished");
  });

  test("use tracking: markUsed bumps usageCount only for the owner", async () => {
    const created = await requestWithCookie("/api/me/saved-meals", userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Spuntino", items: WORK_BREAKFAST.items }),
    });
    const mealId = ((await created.json()) as { savedMeal: { id: string } }).savedMeal.id;

    const used = await requestWithCookie(`/api/me/saved-meals/${mealId}/use`, userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mealId: "meal-xyz-1" }),
    });
    expect(used.status).toBe(200);
    const usedBody = savedMealResponseSchema.parse(await used.json());
    expect(usedBody.savedMeal.usageCount).toBe(1);
    expect(usedBody.savedMeal.lastUsedAt).not.toBeNull();

    // A second meal created from the same template counts again.
    const usedAgain = await requestWithCookie(`/api/me/saved-meals/${mealId}/use`, userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mealId: "meal-xyz-2" }),
    });
    const againBody = savedMealResponseSchema.parse(await usedAgain.json());
    expect(againBody.savedMeal.usageCount).toBe(2);
  });

  test("delete saved meal removes template but leaves historical meals", async () => {
    // Seed a historical meal for user A directly.
    await harness.db.$client.unsafe(
      `INSERT INTO meals (id, user_id, name, category, meal_date, calories, protein_grams,
                          carbohydrates_grams, fat_grams, source)
       VALUES ('meal-hist-1', (SELECT id FROM "user" WHERE email = $1),
               'Colazione ufficio', 'breakfast', '2026-08-29', 340, 12, 40, 10, 'manual')`,
      [userAEmail],
    );

    const created = await requestWithCookie("/api/me/saved-meals", userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Da eliminare", items: WORK_BREAKFAST.items }),
    });
    const mealId = ((await created.json()) as { savedMeal: { id: string } }).savedMeal.id;

    // Link provenance as if the historical meal came from this template.
    await harness.db.$client.unsafe(
      `INSERT INTO meal_provenance (meal_id, source_saved_meal_id) VALUES ('meal-hist-1', $1)`,
      [mealId],
    );

    const del = await requestWithCookie(`/api/me/saved-meals/${mealId}`, userAJar, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);

    const gone = await requestWithCookie(`/api/me/saved-meals/${mealId}`, userAJar);
    expect(gone.status).toBe(404);

    // Historical meal is untouched.
    const hist = await harness.db.$client.unsafe<{ id: string }[]>(
      `SELECT id FROM meals WHERE id = 'meal-hist-1'`,
    );
    expect(hist).toHaveLength(1);
    // Provenance keeps the dangling source id by design (plain text, no FK).
    const prov = await harness.db.$client.unsafe<{ source_saved_meal_id: string }[]>(
      `SELECT source_saved_meal_id FROM meal_provenance WHERE meal_id = 'meal-hist-1'`,
    );
    expect(prov[0]?.source_saved_meal_id).toBe(mealId);
  });

  test("validation: empty items and bad time format are rejected", async () => {
    const empty = await requestWithCookie("/api/me/saved-meals", userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Vuoto", items: [] }),
    });
    expect(empty.status).toBe(400);

    const badTime = await requestWithCookie("/api/me/saved-meals", userAJar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Orario assurdo",
        items: WORK_BREAKFAST.items,
        routine: { weekdays: [0], localTime: "25:99", isReminderEnabled: false },
      }),
    });
    expect(badTime.status).toBe(400);
  });
});
