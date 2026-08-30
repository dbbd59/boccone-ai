export {
  AI_FEATURES,
  AI_PROVIDERS,
  getProviderDefinition,
  listProviderDefinitions,
  listSupportedModels,
  validateModelSelection,
  type AiFeature,
  type AiProvider,
  type AiModelDefinition,
  type AiProviderGuide,
  type AiProviderDefinition,
} from "./registry";
export { AiError, normalizeAiError, type AiErrorCode } from "./errors";
export {
  discoverModels,
  type AiModelCapabilities,
  type AiModelDescriptor,
  type AiModelPricing,
  type DiscoverModelsInput,
} from "./model-discovery";
export {
  createAiHarness,
  createMockAiHarness,
  type AiHarness,
  type AiInvocationContext,
  type AiInvocationRecord,
  type AiUsage,
  type MockAiHarnessOptions,
  type RunStructuredInput,
  type RunTextInput,
} from "./harness";
export {
  createMealCatalogTools,
  type MealCatalogToolCallbacks,
  type MealCatalogToolFood,
  type MealCatalogToolPortion,
} from "./meal-tools";
export {
  buildMealInterpretationPrompt,
  mealInterpretationSchema,
  type MealInterpretation,
  type MealInterpretationFood,
  type MealInterpretationPromptInput,
} from "./meal-natural-language";
