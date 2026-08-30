import { useState, type FormEvent } from "react";

import type { CreateMealRequest, Meal, MealCategory } from "@boccone/api-client";
import { Alert, Button, Field, Input, Text } from "@boccone/ui-web";

import { createAdminMeal, updateAdminMeal } from "../../lib/admin-api";

const CATEGORIES: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];
const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

interface Draft {
  name: string;
  category: MealCategory;
  date: string;
  calories: string;
  proteinGrams: string;
  carbohydratesGrams: string;
  fatGrams: string;
  notes: string;
}

export function MealForm({
  userId,
  meal,
  onSaved,
  onCancel,
}: {
  userId: string;
  meal?: Meal;
  onSaved: (meal: Meal) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => (meal ? toDraft(meal) : emptyDraft()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDraft<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setError(null);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = parseDraft(draft);
    if (!input) {
      setError("Enter a name, date, and whole numbers from zero for nutrition values.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const saved = meal
        ? await updateAdminMeal(userId, meal.id, input)
        : await createAdminMeal(userId, input);
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save meal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-meal-form" onSubmit={(event) => void save(event)}>
      <div>
        <Text as="h4" variant="headingMd">
          {meal ? "Edit meal" : "New meal"}
        </Text>
        <Text variant="bodySm" tone="secondary">
          Confirmed nutrition values only. Meal photos and provider payloads are not stored.
        </Text>
      </div>
      <div className="admin-form-grid">
        <Field fieldId="meal-name" label="Name" required>
          <Input
            id="meal-name"
            required
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
          />
        </Field>
        <Field fieldId="meal-category" label="Category" required>
          <select
            id="meal-category"
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
        <Field fieldId="meal-date" label="Date" required>
          <Input
            id="meal-date"
            required
            type="date"
            value={draft.date}
            onChange={(event) => updateDraft("date", event.target.value)}
          />
        </Field>
        <Field fieldId="meal-calories" label="Calories (kcal)" required>
          <Input
            id="meal-calories"
            min="0"
            required
            type="number"
            value={draft.calories}
            onChange={(event) => updateDraft("calories", event.target.value)}
          />
        </Field>
        <Field fieldId="meal-protein" label="Protein (g)" required>
          <Input
            id="meal-protein"
            min="0"
            required
            type="number"
            value={draft.proteinGrams}
            onChange={(event) => updateDraft("proteinGrams", event.target.value)}
          />
        </Field>
        <Field fieldId="meal-carbs" label="Carbohydrates (g)" required>
          <Input
            id="meal-carbs"
            min="0"
            required
            type="number"
            value={draft.carbohydratesGrams}
            onChange={(event) => updateDraft("carbohydratesGrams", event.target.value)}
          />
        </Field>
        <Field fieldId="meal-fat" label="Fat (g)" required>
          <Input
            id="meal-fat"
            min="0"
            required
            type="number"
            value={draft.fatGrams}
            onChange={(event) => updateDraft("fatGrams", event.target.value)}
          />
        </Field>
        <Field className="admin-form-wide" fieldId="meal-notes" label="Notes">
          <textarea
            id="meal-notes"
            value={draft.notes}
            onChange={(event) => updateDraft("notes", event.target.value)}
          />
        </Field>
      </div>
      {error ? <Alert tone="danger" message={error} /> : null}
      <div className="admin-form-actions">
        <Button loading={loading} type="submit">
          {meal ? "Save changes" : "Create meal"}
        </Button>
        {onCancel ? (
          <Button disabled={loading} type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
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
    notes: "",
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
    notes: meal.notes ?? "",
  };
}

function parseDraft(draft: Draft): CreateMealRequest | null {
  const numbers = [
    draft.calories,
    draft.proteinGrams,
    draft.carbohydratesGrams,
    draft.fatGrams,
  ].map(parseNumber);
  if (
    !draft.name.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) ||
    numbers.some((value) => value === null)
  )
    return null;
  const [calories, proteinGrams, carbohydratesGrams, fatGrams] = numbers as [
    number,
    number,
    number,
    number,
  ];
  return {
    name: draft.name.trim(),
    category: draft.category,
    date: draft.date,
    calories,
    proteinGrams,
    carbohydratesGrams,
    fatGrams,
    notes: draft.notes.trim() || null,
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
