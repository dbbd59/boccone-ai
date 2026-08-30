import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, SectionList, StyleSheet, View } from "react-native";

import type { AiModel, AiModelDescriptor, AiProviderDefinition } from "@boccone/api-client";
import { borderWidths, iconSizes, minTouchTarget, radii, spacing } from "@boccone/design-tokens";
import {
  Button,
  Divider,
  Field,
  Input,
  Stack,
  Surface,
  Text,
  useThemeColors,
} from "@boccone/ui-mobile";

import type { TranslationCopy } from "../../i18n/translations";

type SettingsCopy = TranslationCopy["settings"];

interface AiModelSelectorProps {
  provider: AiProviderDefinition;
  models: AiModelDescriptor[];
  selectedModel: string;
  copy: SettingsCopy;
  onSelect: (model: string) => void;
}

interface ModelSection {
  title: string;
  data: AiModelDescriptor[];
}

export function AiModelSelector({
  provider,
  models,
  selectedModel,
  copy,
  onSelect,
}: AiModelSelectorProps) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualModel, setManualModel] = useState(selectedModel);
  const selected = models.find((model) => model.id === selectedModel);
  const selectedRecommendation = provider.recommendedModels.find(
    (model) => model.id === selectedModel,
  );
  const selectedLabel =
    (selected?.displayName ?? selectedRecommendation?.label ?? selectedModel) || copy.aiSelectModel;
  const localManualDescriptor: AiModelDescriptor | null =
    selectedModel && !selected
      ? { id: selectedModel, displayName: selectedModel, provider: provider.id, source: "manual" }
      : null;
  const selectorModels = localManualDescriptor ? [localManualDescriptor, ...models] : models;

  return (
    <>
      <Button
        fullWidth
        variant="secondary"
        onPress={() => {
          setManualModel(selectedModel);
          setOpen(true);
        }}
        accessibilityLabel={copy.aiSelectModel}
      >
        {selectedLabel}
      </Button>
      {selectedModel ? (
        <View style={styles.selectedMeta}>
          <Text variant="caption" tone="secondary">
            {selectedModel}
          </Text>
          {localManualDescriptor ? (
            <Text variant="caption" tone="warning">
              {copy.aiModelNotListed}
            </Text>
          ) : null}
        </View>
      ) : null}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background.default }]}>
          <View style={styles.header}>
            <Stack gap="xs" style={styles.headerCopy}>
              <Text variant="headingLg">{copy.aiSelectModel}</Text>
              <Text variant="bodySm" tone="secondary">
                {provider.label}
              </Text>
            </Stack>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.aiManualCancel}
              onPress={() => setOpen(false)}
              style={styles.close}
            >
              <MaterialCommunityIcons
                color={colors.foreground.default}
                name="close"
                size={iconSizes.lg}
              />
            </Pressable>
          </View>
          <ModelList
            models={selectorModels}
            recommendations={provider.recommendedModels}
            selectedModel={selectedModel}
            copy={copy}
            onSelect={(id) => {
              onSelect(id);
              setOpen(false);
            }}
          />
          <Surface style={styles.manualCard}>
            <Stack gap="xs">
              <Text variant="headingSm">{copy.aiManualFallbackTitle}</Text>
              <Text variant="bodySm" tone="secondary">
                {copy.aiManualFallbackBody}
              </Text>
              <Button variant="ghost" fullWidth onPress={() => setManualOpen(true)}>
                {copy.aiManualAction}
              </Button>
            </Stack>
          </Surface>
        </View>
        <ManualModelModal
          visible={manualOpen}
          value={manualModel}
          copy={copy}
          onChange={setManualModel}
          onCancel={() => setManualOpen(false)}
          onSave={() => {
            const value = manualModel.trim();
            if (!value) return;
            onSelect(value);
            setManualOpen(false);
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

function ModelList({
  models,
  recommendations,
  selectedModel,
  copy,
  onSelect,
}: {
  models: AiModelDescriptor[];
  recommendations: AiModel[];
  selectedModel: string;
  copy: SettingsCopy;
  onSelect: (id: string) => void;
}) {
  const colors = useThemeColors();
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const filtered = models.filter((model) =>
    [model.displayName, model.id, model.publisher]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase().includes(query)),
  );
  const recommendationIds = new Set(recommendations.map((model) => model.id));
  const recommended = filtered.filter((model) => recommendationIds.has(model.id));
  const all = filtered.filter((model) => !recommendationIds.has(model.id));
  const sections: ModelSection[] = [];
  if (recommended.length > 0) sections.push({ title: copy.aiRecommended, data: recommended });
  if (all.length > 0) sections.push({ title: copy.aiAllModels, data: all });

  return (
    <>
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder={copy.aiSearchModels}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        style={styles.list}
        renderSectionHeader={({ section }) => (
          <Text variant="label" style={styles.sectionTitle}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: item.id === selectedModel }}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.border.subtle },
              pressed && { backgroundColor: colors.background.subtle },
            ]}
          >
            <Stack gap="xs" style={styles.rowCopy}>
              <Text variant="bodyLg">{item.displayName}</Text>
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {item.id}
              </Text>
              <View style={styles.metadata}>
                {item.publisher ? (
                  <Text variant="caption" tone="secondary">
                    {item.publisher}
                  </Text>
                ) : null}
                {item.contextWindow ? (
                  <Text variant="caption" tone="secondary">
                    {copy.aiModelContext(item.contextWindow)}
                  </Text>
                ) : null}
              </View>
            </Stack>
            {item.id === selectedModel ? (
              <MaterialCommunityIcons
                color={colors.interactive.default}
                name="check-circle"
                size={iconSizes.lg}
              />
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text variant="bodySm" tone="secondary" style={styles.empty}>
            {copy.aiNoModels}
          </Text>
        }
      />
      <Divider />
    </>
  );
}

function ManualModelModal({
  visible,
  value,
  copy,
  onChange,
  onCancel,
  onSave,
}: {
  visible: boolean;
  value: string;
  copy: SettingsCopy;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={[styles.modal, { backgroundColor: colors.background.default }]}>
        <View style={styles.header}>
          <Text variant="headingLg">{copy.aiManualFallbackTitle}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.aiManualCancel}
            onPress={onCancel}
            style={styles.close}
          >
            <MaterialCommunityIcons
              color={colors.foreground.default}
              name="close"
              size={iconSizes.lg}
            />
          </Pressable>
        </View>
        <Stack gap="lg">
          <Field label={copy.aiManualModelLabel}>
            <Input
              value={value}
              onChangeText={onChange}
              placeholder={copy.aiManualModelPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </Field>
          <Button fullWidth disabled={!value.trim()} onPress={onSave}>
            {copy.aiManualSave}
          </Button>
          <Button fullWidth variant="ghost" onPress={onCancel}>
            {copy.aiManualCancel}
          </Button>
        </Stack>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, padding: spacing[6] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  headerCopy: { flex: 1 },
  close: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { flex: 1 },
  sectionTitle: { paddingTop: spacing[4], paddingBottom: spacing[2] },
  row: {
    minHeight: minTouchTarget + spacing[6],
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderBottomWidth: borderWidths.hairline,
    borderRadius: radii.sm,
  },
  rowCopy: { flex: 1, minWidth: 0 },
  metadata: { flexDirection: "row", gap: spacing[2], flexWrap: "wrap" },
  empty: { paddingVertical: spacing[4] },
  selectedMeta: { gap: spacing[1], paddingHorizontal: spacing[2] },
  manualCard: { marginTop: spacing[4] },
});
