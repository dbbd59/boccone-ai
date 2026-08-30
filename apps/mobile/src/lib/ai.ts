import {
  deleteAiApiKey,
  getAiModels,
  getAiSettings,
  interpretMealWithAi,
  testAiConnection,
  updateAiSettings,
  type ErrorResponse,
  type AiModelsResponse,
  type AiSettingsResponse,
  type MealDraftResponse,
  type MealInterpretationRequest,
  type UpdateAiSettingsRequest,
} from "@boccone/api-client";

export type AiClientErrorCode = Extract<ErrorResponse["error"]["code"], `ai_${string}`>;

export class AiRequestError extends Error {
  readonly code: AiClientErrorCode | null;

  constructor(code: AiClientErrorCode | null, fallbackMessage: string) {
    super(fallbackMessage);
    this.name = "AiRequestError";
    this.code = code;
  }
}

export async function fetchAiSettings(): Promise<AiSettingsResponse> {
  try {
    const result = await getAiSettings();
    if (result.error || result.data === undefined)
      throwApiError(result.error, "Unable to load AI settings");
    return result.data;
  } catch (error) {
    throw normalizeClientError(error, "Unable to load AI settings");
  }
}

export async function fetchAiModels(refresh = false): Promise<AiModelsResponse> {
  try {
    const result = await getAiModels({ query: refresh ? { refresh: true } : undefined });
    if (result.error || result.data === undefined)
      throwApiError(result.error, "Unable to load AI models");
    return result.data;
  } catch (error) {
    throw normalizeClientError(error, "Unable to load AI models");
  }
}

export async function saveAiSettings(input: UpdateAiSettingsRequest): Promise<AiSettingsResponse> {
  try {
    const result = await updateAiSettings({ body: input });
    if (result.error || result.data === undefined)
      throwApiError(result.error, "Unable to save AI settings");
    return result.data;
  } catch (error) {
    throw normalizeClientError(error, "Unable to save AI settings");
  }
}

export async function removeAiApiKey(): Promise<AiSettingsResponse> {
  try {
    const result = await deleteAiApiKey();
    if (result.error || result.data === undefined)
      throwApiError(result.error, "Unable to delete AI key");
    return result.data;
  } catch (error) {
    throw normalizeClientError(error, "Unable to delete AI key");
  }
}

export async function testAiProvider(): Promise<void> {
  try {
    const result = await testAiConnection();
    if (result.error || result.data === undefined)
      throwApiError(result.error, "AI connection test failed");
  } catch (error) {
    throw normalizeClientError(error, "AI connection test failed");
  }
}

export async function interpretMeal(
  input: MealInterpretationRequest,
  signal?: AbortSignal,
): Promise<MealDraftResponse> {
  try {
    const result = await interpretMealWithAi({ body: input, signal });
    if (result.error || result.data === undefined)
      throwApiError(result.error, "Unable to interpret meal");
    return result.data;
  } catch (error) {
    throw normalizeClientError(error, "Unable to interpret meal");
  }
}

function throwApiError(error: unknown, fallbackMessage: string): never {
  const code = readAiCode(error);
  throw new AiRequestError(code, fallbackMessage);
}

function normalizeClientError(error: unknown, fallbackMessage: string): AiRequestError {
  if (error instanceof AiRequestError) return error;
  if (isAbortError(error)) return new AiRequestError("ai_cancelled", "AI request cancelled");
  return new AiRequestError(null, fallbackMessage);
}

function readAiCode(error: unknown): AiClientErrorCode | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { error?: { code?: unknown } }).error?.code;
  return typeof code === "string" && code.startsWith("ai_") ? (code as AiClientErrorCode) : null;
}

function isAbortError(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && (error as { name?: unknown }).name === "AbortError",
  );
}
