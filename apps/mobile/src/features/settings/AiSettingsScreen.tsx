import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import type { AiProvider } from "@boccone/api-client";
import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  Field,
  Input,
  Inline,
  InlineLink,
  PasswordInput,
  Screen,
  Stack,
  Surface,
  Text,
} from "@boccone/ui-mobile";

import { useI18n } from "../../i18n/context";
import type { TranslationCopy } from "../../i18n/translations";
import {
  fetchAiModels,
  fetchAiSettings,
  removeAiApiKey,
  saveAiSettings,
  testAiProvider,
  type AiRequestError,
} from "../../lib/ai";
import { AiModelSelector } from "./AiModelSelector";
import { AiProviderGuide } from "./AiProviderGuide";

export function AiSettingsScreen() {
  const { copy } = useI18n();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<AiProvider | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [refreshNumber, setRefreshNumber] = useState(0);
  const settingsQuery = useQuery({
    queryKey: ["mobile-ai-settings"],
    queryFn: fetchAiSettings,
  });

  const current = settingsQuery.data?.settings;
  const activeProvider = provider ?? current?.provider ?? "openai";
  const selectedProvider = settingsQuery.data?.providers.find((item) => item.id === activeProvider);
  const requiresBaseUrl = selectedProvider?.requiresBaseUrl ?? false;
  const activeBaseUrl =
    baseUrl ?? (activeProvider === current?.provider ? (current?.baseUrl ?? "") : "");
  const activeModel = model ?? (activeProvider === current?.provider ? (current.model ?? "") : "");
  const baseUrlMatches =
    !requiresBaseUrl ||
    (activeProvider === current?.provider &&
      activeBaseUrl.trim() === (current?.baseUrl ?? "").trim());
  const hasUnsavedApiKey = apiKey.trim().length > 0;
  const canDiscover =
    current?.hasApiKey === true &&
    current.provider === activeProvider &&
    selectedProvider !== undefined &&
    selectedProvider.supportsModelDiscovery &&
    baseUrlMatches &&
    !hasUnsavedApiKey;
  const canTest =
    current?.hasApiKey === true &&
    current.provider === activeProvider &&
    activeModel === (current.model ?? "") &&
    baseUrlMatches &&
    !hasUnsavedApiKey &&
    Boolean(activeModel);
  const modelsQuery = useQuery({
    queryKey: ["mobile-ai-models", activeProvider, refreshNumber],
    queryFn: () => fetchAiModels(refreshNumber > 0),
    enabled: canDiscover,
    staleTime: 30 * 60_000,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveAiSettings({
        provider: activeProvider,
        ...(activeModel.trim() ? { model: activeModel.trim() } : {}),
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        ...(requiresBaseUrl && activeBaseUrl.trim()
          ? { baseUrl: activeBaseUrl.trim() }
          : { baseUrl: null }),
      }),
    onSuccess: async (data) => {
      setApiKey("");
      setProvider(data.settings?.provider ?? activeProvider);
      setModel(data.settings?.model ?? null);
      setMessage(copy.settings.aiSaved);
      await queryClient.setQueryData(["mobile-ai-settings"], data);
      setRefreshNumber((value) => value + 1);
    },
    onError: (error) => setMessage(errorCopy(error, copy.settings.aiSaveError, copy.settings)),
  });
  const testMutation = useMutation({
    mutationFn: testAiProvider,
    onSuccess: () => setMessage(copy.settings.aiTestSuccess),
    onError: (error) => setMessage(errorCopy(error, copy.settings.aiTestError, copy.settings)),
  });
  const deleteMutation = useMutation({
    mutationFn: removeAiApiKey,
    onSuccess: async (data) => {
      setMessage(copy.settings.aiKeyDeleted);
      await queryClient.setQueryData(["mobile-ai-settings"], data);
      queryClient.removeQueries({ queryKey: ["mobile-ai-models"] });
    },
    onError: (error) => setMessage(errorCopy(error, copy.settings.aiSaveError, copy.settings)),
  });

  if (settingsQuery.isPending) {
    return (
      <Screen>
        <Text role="status">{copy.settings.aiLoading}</Text>
      </Screen>
    );
  }
  if (settingsQuery.isError || !settingsQuery.data || !selectedProvider) {
    return (
      <Screen>
        <Alert tone="danger" message={copy.settings.aiLoadError} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="title">{copy.settings.aiTitle}</Text>
            <Text variant="bodySm" tone="secondary">
              {copy.settings.aiBody}
            </Text>
            <Text variant="bodySm" tone="secondary">
              {copy.settings.aiWhy}
            </Text>
          </Stack>

          <Surface>
            <Stack gap="lg">
              <Field label={copy.settings.aiProviderLabel}>
                <Stack gap="xs">
                  {settingsQuery.data.providers.map((item) => (
                    <Button
                      key={item.id}
                      fullWidth
                      variant={item.id === activeProvider ? "secondary" : "ghost"}
                      onPress={() => {
                        setProvider(item.id);
                        setModel(null);
                        setBaseUrl(null);
                        setApiKey("");
                        setMessage(null);
                      }}
                      accessibilityLabel={item.label}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              </Field>
              <Text variant="caption" tone="secondary">
                {copy.settings.aiProviderHint}
              </Text>

              <Field label={copy.settings.aiApiKeyLabel}>
                <PasswordInput
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder={copy.settings.aiApiKeyPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  showLabel={copy.settings.aiShowKey}
                  hideLabel={copy.settings.aiHideKey}
                />
                <InlineLink onPress={() => setGuideOpen(true)}>
                  {copy.settings.aiGetApiKey}
                </InlineLink>
                {current?.hasApiKey && activeProvider === current.provider ? (
                  <Text variant="caption" tone="secondary">
                    {copy.settings.aiKeyStored}
                  </Text>
                ) : null}
              </Field>

              {requiresBaseUrl ? (
                <Field
                  label={copy.settings.aiBaseUrlLabel}
                  description={copy.settings.aiBaseUrlHint}
                >
                  <Input
                    value={activeBaseUrl}
                    onChangeText={setBaseUrl}
                    placeholder={copy.settings.aiBaseUrlPlaceholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </Field>
              ) : null}

              <Stack gap="sm">
                <Inline align="center" justify="between">
                  <Text variant="label">{copy.settings.aiModelLabel}</Text>
                  {canDiscover ? (
                    <Button
                      variant="ghost"
                      loading={modelsQuery.isFetching}
                      onPress={() => setRefreshNumber((value) => value + 1)}
                    >
                      {copy.settings.aiRefreshModels}
                    </Button>
                  ) : null}
                </Inline>
                {modelsQuery.isPending ? (
                  <Text variant="bodySm" tone="secondary" role="status">
                    {copy.settings.aiLoadingModels}
                  </Text>
                ) : null}
                {modelsQuery.isError ? (
                  <Alert tone="warning" message={copy.settings.aiModelsError} />
                ) : null}
                {modelsQuery.data?.stale ? (
                  <Alert tone="warning" message={copy.settings.aiModelsStale} />
                ) : null}
                {modelsQuery.data?.models.length === 0 ? (
                  <Text variant="bodySm" tone="secondary">
                    {copy.settings.aiNoModels}
                  </Text>
                ) : null}
                <AiModelSelector
                  provider={selectedProvider}
                  models={modelsQuery.data?.models ?? []}
                  selectedModel={activeModel}
                  copy={copy.settings}
                  onSelect={setModel}
                />
              </Stack>

              <Button
                fullWidth
                loading={saveMutation.isPending}
                onPress={() => saveMutation.mutate()}
              >
                {copy.settings.aiSave}
              </Button>
              <Button
                fullWidth
                variant="secondary"
                loading={testMutation.isPending}
                disabled={!canTest}
                onPress={() => testMutation.mutate()}
              >
                {copy.settings.aiTest}
              </Button>
              {current?.hasApiKey ? (
                <Button
                  variant="ghost"
                  loading={deleteMutation.isPending}
                  onPress={() => deleteMutation.mutate()}
                >
                  {copy.settings.aiDeleteKey}
                </Button>
              ) : null}
            </Stack>
          </Surface>
          {message ? <Alert tone="info" message={message} /> : null}
        </Stack>
      </ScrollView>
      {guideOpen ? (
        <AiProviderGuide
          provider={selectedProvider}
          copy={copy.settings}
          onClose={() => setGuideOpen(false)}
        />
      ) : null}
    </Screen>
  );
}

function errorCopy(error: unknown, fallback: string, copy: TranslationCopy["settings"]): string {
  const code = error instanceof Error && "code" in error ? (error as AiRequestError).code : null;
  switch (code) {
    case "ai_invalid_credentials":
      return copy.aiInvalidCredentials;
    case "ai_model_not_found":
      return copy.aiModelNotFound;
    case "ai_model_not_accessible":
      return copy.aiModelNotAccessible;
    case "ai_model_not_selected":
      return copy.aiModelNotSelected;
    case "ai_provider_unavailable":
    case "ai_model_discovery_unavailable":
      return copy.aiProviderUnavailable;
    case "ai_rate_limited":
      return copy.aiRateLimited;
    case "ai_timeout":
      return copy.aiTimeout;
    default:
      return fallback;
  }
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing[12] },
});
