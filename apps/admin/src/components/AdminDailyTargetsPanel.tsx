import { useEffect, useState, type FormEvent } from "react";

import type { DailyTargets } from "@boccone/api-client";
import { Alert, Button, Field, Input, Text } from "@boccone/ui-web";

import { removeAdminTargets, updateAdminTargets } from "../lib/admin-api";

type DraftTargets = Record<keyof DailyTargets, string>;

const EMPTY_DRAFT: DraftTargets = {
  calories: "",
  proteinGrams: "",
  carbohydratesGrams: "",
  fatGrams: "",
};

const EMPTY_TARGETS: DailyTargets = {
  calories: null,
  proteinGrams: null,
  carbohydratesGrams: null,
  fatGrams: null,
};

export function AdminDailyTargetsPanel({
  loading,
  targets,
  userId,
  onChanged,
}: {
  loading: boolean;
  targets: DailyTargets | null;
  userId: string;
  onChanged: (targets: DailyTargets) => void;
}) {
  const [draft, setDraft] = useState<DraftTargets>(EMPTY_DRAFT);
  const [action, setAction] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targets) return;
    // Keep the editor synchronized when the selected account changes or reloads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(toDraft(targets));
    setError(null);
  }, [targets]);

  function updateDraft(key: keyof DailyTargets, value: string) {
    setError(null);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseDraft(draft);
    if (!parsed) {
      setError("Enter positive whole numbers or leave fields blank.");
      return;
    }
    setAction("save");
    setError(null);
    try {
      const updated = await updateAdminTargets(userId, parsed);
      setDraft(toDraft(updated));
      onChanged(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update user targets");
    } finally {
      setAction(null);
    }
  }

  async function remove() {
    if (!window.confirm("Remove all daily targets for this user? This cannot be undone.")) return;
    setAction("remove");
    setError(null);
    try {
      await removeAdminTargets(userId);
      setDraft(EMPTY_DRAFT);
      onChanged(EMPTY_TARGETS);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove user targets");
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="admin-targets-panel">
      <div className="admin-section-heading">
        <div>
          <Text as="h3" variant="headingSm">
            Daily targets
          </Text>
          <Text variant="bodySm" tone="secondary">
            Admins can correct or remove this user&apos;s nutrition targets.
          </Text>
        </div>
      </div>
      {loading ? (
        <Text variant="bodySm" tone="secondary" role="status">
          Loading targets…
        </Text>
      ) : (
        <form className="admin-targets-form" onSubmit={(event) => void save(event)}>
          <div className="admin-targets-grid">
            <Field fieldId="admin-target-calories" label="Calories (kcal)">
              <Input
                id="admin-target-calories"
                inputMode="numeric"
                min="1"
                type="number"
                value={draft.calories}
                onChange={(event) => updateDraft("calories", event.target.value)}
              />
            </Field>
            <Field fieldId="admin-target-protein" label="Protein (g)">
              <Input
                id="admin-target-protein"
                inputMode="numeric"
                min="1"
                type="number"
                value={draft.proteinGrams}
                onChange={(event) => updateDraft("proteinGrams", event.target.value)}
              />
            </Field>
            <Field fieldId="admin-target-carbohydrates" label="Carbohydrates (g)">
              <Input
                id="admin-target-carbohydrates"
                inputMode="numeric"
                min="1"
                type="number"
                value={draft.carbohydratesGrams}
                onChange={(event) => updateDraft("carbohydratesGrams", event.target.value)}
              />
            </Field>
            <Field fieldId="admin-target-fat" label="Fat (g)">
              <Input
                id="admin-target-fat"
                inputMode="numeric"
                min="1"
                type="number"
                value={draft.fatGrams}
                onChange={(event) => updateDraft("fatGrams", event.target.value)}
              />
            </Field>
          </div>
          <Text variant="caption" tone="secondary">
            Leave a field blank to clear that target. Delete removes the target record entirely.
          </Text>
          {error ? <Alert tone="danger" message={error} /> : null}
          <div className="admin-targets-actions">
            <Button type="submit" loading={action === "save"} disabled={action !== null}>
              Save targets
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={action === "remove"}
              disabled={action !== null}
              onClick={() => void remove()}
            >
              Delete targets
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function toDraft(targets: DailyTargets): DraftTargets {
  return {
    calories: formatTarget(targets.calories),
    proteinGrams: formatTarget(targets.proteinGrams),
    carbohydratesGrams: formatTarget(targets.carbohydratesGrams),
    fatGrams: formatTarget(targets.fatGrams),
  };
}

function formatTarget(value: number | null): string {
  return value === null ? "" : String(value);
}

function parseDraft(draft: DraftTargets): DailyTargets | null {
  const calories = parseValue(draft.calories);
  const proteinGrams = parseValue(draft.proteinGrams);
  const carbohydratesGrams = parseValue(draft.carbohydratesGrams);
  const fatGrams = parseValue(draft.fatGrams);
  if (
    calories === INVALID ||
    proteinGrams === INVALID ||
    carbohydratesGrams === INVALID ||
    fatGrams === INVALID
  ) {
    return null;
  }
  return { calories, proteinGrams, carbohydratesGrams, fatGrams };
}

const INVALID = Symbol("invalid-target");

function parseValue(value: string): number | null | typeof INVALID {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : INVALID;
}
