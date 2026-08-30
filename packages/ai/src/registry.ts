export const AI_PROVIDERS = [
  "openai",
  "anthropic",
  "gemini",
  "openrouter",
  "openai-compatible",
] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number];

export const AI_FEATURES = ["MEAL_NATURAL_LANGUAGE", "AI_CONNECTION_TEST"] as const;
export type AiFeature = (typeof AI_FEATURES)[number];

export interface AiModelDefinition {
  id: string;
  label: string;
  capabilities: {
    text: true;
    structuredOutput: true;
    tools: true;
    vision: boolean;
  };
}

export interface AiProviderGuide {
  key: AiProvider;
  docsUrl?: string;
  apiKeyUrl?: string;
}

export interface AiProviderDefinition {
  id: AiProvider;
  label: string;
  requiresBaseUrl: boolean;
  supportsModelDiscovery: boolean;
  guide: AiProviderGuide;
  recommendedModels: readonly AiModelDefinition[];
}

const textModel = (id: string, label: string, vision = false): AiModelDefinition => ({
  id,
  label,
  capabilities: { text: true, structuredOutput: true, tools: true, vision },
});

const PROVIDER_DEFINITIONS: readonly AiProviderDefinition[] = [
  {
    id: "openai",
    label: "OpenAI",
    requiresBaseUrl: false,
    supportsModelDiscovery: true,
    guide: {
      key: "openai",
      docsUrl: "https://developers.openai.com/api/reference/resources/models/methods/list",
      apiKeyUrl: "https://platform.openai.com/api-keys",
    },
    recommendedModels: [
      textModel("gpt-5-mini", "GPT-5 mini", true),
      textModel("gpt-4o-mini", "GPT-4o mini", true),
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    requiresBaseUrl: false,
    supportsModelDiscovery: true,
    guide: {
      key: "anthropic",
      docsUrl: "https://docs.anthropic.com/en/api/models-list",
      apiKeyUrl: "https://platform.claude.com/settings/keys",
    },
    recommendedModels: [textModel("claude-sonnet-4-6", "Claude Sonnet", true)],
  },
  {
    id: "gemini",
    label: "Google Gemini",
    requiresBaseUrl: false,
    supportsModelDiscovery: true,
    guide: {
      key: "gemini",
      docsUrl: "https://ai.google.dev/api/models",
      apiKeyUrl: "https://aistudio.google.com/app/apikey",
    },
    recommendedModels: [
      textModel("gemini-3.1-pro-preview", "Gemini 3.1 Pro", true),
      textModel("gemini-2.5-flash", "Gemini 2.5 Flash", true),
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    requiresBaseUrl: false,
    supportsModelDiscovery: true,
    guide: {
      key: "openrouter",
      docsUrl: "https://openrouter.ai/docs/api/api-reference/models/get-models",
      apiKeyUrl: "https://openrouter.ai/settings/keys",
    },
    recommendedModels: [
      textModel("openai/gpt-5-mini", "OpenAI GPT-5 mini", true),
      textModel("anthropic/claude-sonnet-4.6", "Anthropic Claude Sonnet", true),
      textModel("google/gemini-2.5-flash", "Google Gemini 2.5 Flash", true),
    ],
  },
  {
    id: "openai-compatible",
    label: "OpenAI-compatible",
    requiresBaseUrl: true,
    supportsModelDiscovery: true,
    guide: { key: "openai-compatible" },
    recommendedModels: [],
  },
] as const;

export function listProviderDefinitions(): readonly AiProviderDefinition[] {
  return PROVIDER_DEFINITIONS;
}

export function getProviderDefinition(provider: AiProvider): AiProviderDefinition {
  const definition = PROVIDER_DEFINITIONS.find((item) => item.id === provider);
  if (!definition) throw new Error(`Unsupported AI provider: ${provider}`);
  return definition;
}

export function listSupportedModels(provider: AiProvider): readonly AiModelDefinition[] {
  return getProviderDefinition(provider).recommendedModels;
}

/** Validate model syntax before any credential is decrypted. Discovery is advisory. */
export function validateModelSelection(provider: AiProvider, model: string): boolean {
  void provider;
  const normalized = model.trim();
  return (
    normalized.length > 0 &&
    normalized.length <= 160 &&
    !Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  );
}
