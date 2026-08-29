import { useState, type FormEvent } from "react";

import type { CreateMealRequest, Meal, MealCategory } from "@boccone/api-client";
import { Alert, Button, Field, Input, Text } from "@boccone/ui-web";

import { createAdminMeal, removeAdminMeal, updateAdminMeal } from "../lib/admin-api";

const CATEGORIES: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];
const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

type Draft = Omit<
  CreateMealRequest,
  "calories" | "proteinGrams" | "carbohydratesGrams" | "fatGrams"
> & {
  calories: string;
  proteinGrams: string;
  carbohydratesGrams: string;
  fatGrams: string;
};

export function AdminMealsPanel({
  loading,
  meals,
  userId,
  onChanged,
}: {
  loading: boolean;
  meals: Meal[];
  userId: string;
  onChanged: (meals: Meal[]) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function beginCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
  }

  function beginEdit(meal: Meal) {
    setEditingId(meal.id);
    setDraft(toDraft(meal));
    setError(null);
  }

  function updateDraft<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setError(null);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = parseDraft(draft);
    if (!input) {
      setError("Enter a name, date and whole numbers from zero for nutrition values.");
      return;
    }
    setAction(editingId ? "save" : "create");
    setError(null);
    try {
      if (editingId) {
        const updated = await updateAdminMeal(userId, editingId, input);
        onChanged(meals.map((meal) => (meal.id === updated.id ? updated : meal)));
      } else {
        const created = await createAdminMeal(userId, input);
        onChanged([created, ...meals]);
      }
      beginCreate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save user meal");
    } finally {
      setAction(null);
    }
  }

  async function remove(meal: Meal) {
    if (!window.confirm(`Remove ${meal.name}? This cannot be undone.`)) return;
    setAction(`remove:${meal.id}`);
    setError(null);
    try {
      await removeAdminMeal(userId, meal.id);
      onChanged(meals.filter((entry) => entry.id !== meal.id));
      if (editingId === meal.id) beginCreate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove user meal");
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="admin-meals-panel">
      <div className="admin-section-heading">
        <div>
          <Text as="h3" variant="headingSm">
            Meals
          </Text>
          <Text variant="bodySm" tone="secondary">
            Inspect and correct manually logged meals for this account.
          </Text>
        </div>
        <Button type="button" variant="secondary" onClick={beginCreate}>
          New meal
        </Button>
      </div>

      {loading ? (
        <Text variant="bodySm" tone="secondary" role="status">
          Loading meals…
        </Text>
      ) : (
        <>
          <div className="admin-meal-list">
            {meals.length === 0 ? (
              <div className="admin-empty-state">
                <Text variant="bodySm">No meals logged.</Text>
                <Text variant="bodySm" tone="secondary">
                  Create one below to correct or seed this account.
                </Text>
              </div>
            ) : (
              meals.map((meal) => (
                <div className="admin-meal-row" key={meal.id}>
                  <div>
                    <Text variant="bodySm">
                      <strong>{meal.name}</strong>
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {CATEGORY_LABELS[meal.category]} · {meal.date} · {meal.calories} kcal · P{" "}
                      {meal.proteinGrams} g · C {meal.carbohydratesGrams} g · F {meal.fatGrams} g
                    </Text>
                  </div>
                  <div className="admin-meal-actions">
                    <Button type="button" size="sm" variant="ghost" onClick={() => beginEdit(meal)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      loading={action === `remove:${meal.id}`}
                      disabled={action !== null}
                      onClick={() => void remove(meal)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="admin-meal-form" onSubmit={(event) => void save(event)}>
            <Text as="h4" variant="headingSm">
              {editingId ? "Edit meal" : "Add meal"}
            </Text>
            <div className="admin-form-grid">
              <Field fieldId="admin-meal-name" label="Name" required>
                <Input
                  id="admin-meal-name"
                  required
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
              </Field>
              <Field fieldId="admin-meal-category" label="Category" required>
                <select
                  id="admin-meal-category"
                  value={draft.category}
                  onChange={(event) => updateDraft("category", event.target.value as MealCategory)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field fieldId="admin-meal-date" label="Date" required>
                <Input
                  id="admin-meal-date"
                  required
                  type="date"
                  value={draft.date}
                  onChange={(event) => updateDraft("date", event.target.value)}
                />
              </Field>
              <Field fieldId="admin-meal-calories" label="Calories (kcal)" required>
                <Input
                  id="admin-meal-calories"
                  required
                  min="0"
                  type="number"
                  value={draft.calories}
                  onChange={(event) => updateDraft("calories", event.target.value)}
                />
              </Field>
              <Field fieldId="admin-meal-protein" label="Protein (g)" required>
                <Input
                  id="admin-meal-protein"
                  required
                  min="0"
                  type="number"
                  value={draft.proteinGrams}
                  onChange={(event) => updateDraft("proteinGrams", event.target.value)}
                />
              </Field>
              <Field fieldId="admin-meal-carbs" label="Carbohydrates (g)" required>
                <Input
                  id="admin-meal-carbs"
                  required
                  min="0"
                  type="number"
                  value={draft.carbohydratesGrams}
                  onChange={(event) => updateDraft("carbohydratesGrams", event.target.value)}
                />
              </Field>
              <Field fieldId="admin-meal-fat" label="Fat (g)" required>
                <Input
                  id="admin-meal-fat"
                  required
                  min="0"
                  type="number"
                  value={draft.fatGrams}
                  onChange={(event) => updateDraft("fatGrams", event.target.value)}
                />
              </Field>
              <Field fieldId="admin-meal-notes" label="Notes">
                <textarea
                  id="admin-meal-notes"
                  value={draft.notes ?? ""}
                  onChange={(event) => updateDraft("notes", event.target.value)}
                />
              </Field>
            </div>
            {error ? <Alert tone="danger" message={error} /> : null}
            <div className="admin-meal-form-actions">
              <Button type="submit" loading={action === "save" || action === "create"}>
                {editingId ? "Save changes" : "Create meal"}
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" onClick={beginCreate}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function emptyDraft(): Draft {
  return {
    name: "",
    category: "breakfast",
    date: formatLocalDate(),
    calories: "",
    proteinGrams: "",
    carbohydratesGrams: "",
    fatGrams: "",
    notes: null,
  };
}

function toDraft(meal: Meal): Draft {
  return {
    name: meal.name,
    category: meal.category,
    date: meal.date,
    calories: String(meal.calories),
    proteinGrams: String(meal.proteinGrams),
    carbohydratesGrams: String(meal.carbohydratesGrams),
    fatGrams: String(meal.fatGrams),
    notes: meal.notes,
  };
}

function parseDraft(draft: Draft): CreateMealRequest | null {
  const calories = parseNumber(draft.calories);
  const proteinGrams = parseNumber(draft.proteinGrams);
  const carbohydratesGrams = parseNumber(draft.carbohydratesGrams);
  const fatGrams = parseNumber(draft.fatGrams);
  if (
    !draft.name.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) ||
    calories === null ||
    proteinGrams === null ||
    carbohydratesGrams === null ||
    fatGrams === null
  ) {
    return null;
  }
  const notes = draft.notes?.trim() ?? "";
  return {
    name: draft.name.trim(),
    category: draft.category,
    date: draft.date,
    calories,
    proteinGrams,
    carbohydratesGrams,
    fatGrams,
    notes: notes.length > 0 ? notes : null,
  };
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function formatLocalDate(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
