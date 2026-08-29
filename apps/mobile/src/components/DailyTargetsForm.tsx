import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import {
  getDailyTargetsOptions,
  getDailyTargetsQueryKey,
  type DailyTargets,
} from "@boccone/api-client";
import { spacing } from "@boccone/design-tokens";
import { Alert, Button, Field, Inline, Input, Stack, Surface, Text } from "@boccone/ui-mobile";

import { useI18n } from "../i18n/context";
import { saveDailyTargets } from "../lib/daily-targets";

type DraftTargets = Record<keyof DailyTargets, string>;

const EMPTY_DRAFT: DraftTargets = {
  calories: "",
  proteinGrams: "",
  carbohydratesGrams: "",
  fatGrams: "",
};

export function DailyTargetsForm() {
  const { copy } = useI18n();
  const queryClient = useQueryClient();
  const targetsQuery = useQuery({ ...getDailyTargetsOptions() });
  const [draft, setDraft] = useState<DraftTargets>(EMPTY_DRAFT);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!targetsQuery.data) return;
    // Hydrate the editable draft once the remote target set is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(toDraft(targetsQuery.data.targets));
  }, [targetsQuery.data]);

  const mutation = useMutation({
    mutationFn: saveDailyTargets,
    onSuccess: (result) => {
      queryClient.setQueryData(getDailyTargetsQueryKey(), result);
      setDraft(toDraft(result.targets));
      setSaved(true);
    },
  });
  const formDisabled = targetsQuery.isPending || mutation.isPending;

  function updateDraft(key: keyof DailyTargets, value: string) {
    setSaved(false);
    setValidationError(null);
    mutation.reset();
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    const parsed = parseDraft(draft);
    if (!parsed) {
      setValidationError(copy.settings.targetsInvalid);
      return;
    }
    setValidationError(null);
    setSaved(false);
    mutation.mutate(parsed);
  }

  return (
    <Surface elevation="none" style={styles.section}>
      <Stack gap="md">
        <Stack gap="xs">
          <Text variant="headingMd">{copy.settings.targetsTitle}</Text>
          <Text variant="bodySm" tone="secondary">
            {copy.settings.targetsBody}
          </Text>
        </Stack>

        {targetsQuery.isPending ? (
          <Text role="status" variant="bodySm" tone="secondary">
            {copy.loading.tagline}
          </Text>
        ) : null}
        {targetsQuery.isError ? (
          <Alert tone="danger" message={copy.settings.targetsLoadError} />
        ) : null}

        <Inline gap="md" align="start">
          <Field label={copy.settings.caloriesLabel} style={styles.targetField}>
            <Input
              accessibilityLabel={copy.settings.caloriesLabel}
              editable={!formDisabled}
              keyboardType="number-pad"
              value={draft.calories}
              onChangeText={(value) => updateDraft("calories", value)}
            />
          </Field>
          <Field label={copy.settings.proteinLabel} style={styles.targetField}>
            <Input
              accessibilityLabel={copy.settings.proteinLabel}
              editable={!formDisabled}
              keyboardType="number-pad"
              value={draft.proteinGrams}
              onChangeText={(value) => updateDraft("proteinGrams", value)}
            />
          </Field>
        </Inline>
        <Inline gap="md" align="start">
          <Field label={copy.settings.carbohydratesLabel} style={styles.targetField}>
            <Input
              accessibilityLabel={copy.settings.carbohydratesLabel}
              editable={!formDisabled}
              keyboardType="number-pad"
              value={draft.carbohydratesGrams}
              onChangeText={(value) => updateDraft("carbohydratesGrams", value)}
            />
          </Field>
          <Field label={copy.settings.fatLabel} style={styles.targetField}>
            <Input
              accessibilityLabel={copy.settings.fatLabel}
              editable={!formDisabled}
              keyboardType="number-pad"
              value={draft.fatGrams}
              onChangeText={(value) => updateDraft("fatGrams", value)}
            />
          </Field>
        </Inline>

        <Text variant="caption" tone="secondary">
          {copy.settings.targetsOptional}
        </Text>
        {validationError ? <Alert tone="danger" message={validationError} /> : null}
        {mutation.isError ? <Alert tone="danger" message={copy.settings.targetsSaveError} /> : null}
        {saved ? <Alert tone="success" message={copy.settings.targetsSaved} /> : null}
        <Button disabled={formDisabled} fullWidth loading={mutation.isPending} onPress={save}>
          {copy.settings.saveTargets}
        </Button>
      </Stack>
    </Surface>
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

const styles = StyleSheet.create({
  section: {
    padding: spacing[5],
  },
  targetField: {
    flex: 1,
  },
});
