import { AiError } from "./errors";
import { type AiProvider } from "./registry";

export interface AiModelCapabilities {
  text?: boolean;
  vision?: boolean;
  tools?: boolean;
  structuredOutput?: boolean;
  reasoning?: boolean;
}

export interface AiModelPricing {
  input?: number;
  output?: number;
  currency?: string;
  unit?: string;
}

export interface AiModelDescriptor {
  id: string;
  displayName: string;
  provider: AiProvider;
  description?: string;
  contextWindow?: number;
  capabilities?: AiModelCapabilities;
  inputModalities?: string[];
  outputModalities?: string[];
  pricing?: AiModelPricing;
  createdAt?: string;
  publisher?: string;
  source: "provider" | "manual";
}

export interface DiscoverModelsInput {
  provider: AiProvider;
  apiKey: string;
  baseUrl?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
  fetcher?: ModelFetcher;
}

export type ModelFetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const ANTHROPIC_VERSION = "2023-06-01";

/** Fetch and normalize a provider's model catalog. Secrets never leave this boundary. */
export async function discoverModels(input: DiscoverModelsInput): Promise<AiModelDescriptor[]> {
  const fetcher = input.fetcher ?? fetch;
  const timeoutMs = input.timeoutMs ?? 15_000;
  switch (input.provider) {
    case "openai":
      return filterUsableModels(
        await discoverOpenAiModels({
          ...input,
          fetcher,
          timeoutMs,
          baseUrl: input.baseUrl ?? OPENAI_BASE_URL,
        }),
      );
    case "anthropic":
      return filterUsableModels(
        await discoverAnthropicModels({
          ...input,
          fetcher,
          timeoutMs,
          baseUrl: input.baseUrl ?? ANTHROPIC_BASE_URL,
        }),
      );
    case "gemini":
      return filterUsableModels(
        await discoverGeminiModels({
          ...input,
          fetcher,
          timeoutMs,
          baseUrl: input.baseUrl ?? GEMINI_BASE_URL,
        }),
      );
    case "openrouter":
      return filterUsableModels(
        await discoverOpenRouterModels({
          ...input,
          fetcher,
          timeoutMs,
          baseUrl: input.baseUrl ?? OPENROUTER_BASE_URL,
        }),
      );
    case "openai-compatible":
      if (!input.baseUrl) throw new AiError("AI_MODEL_DISCOVERY_UNAVAILABLE");
      return filterUsableModels(
        await discoverOpenAiCompatibleModels({
          ...input,
          fetcher,
          timeoutMs,
          baseUrl: input.baseUrl,
        }),
      );
  }
}

async function discoverOpenAiModels(input: RequiredDiscoveryInput): Promise<AiModelDescriptor[]> {
  const response = await requestJson(
    appendPath(input.baseUrl, "models"),
    { headers: bearerHeaders(input.apiKey) },
    input,
  );
  return parseOpenAiModels(response, input.provider);
}

async function discoverOpenAiCompatibleModels(
  input: RequiredDiscoveryInput,
): Promise<AiModelDescriptor[]> {
  const response = await requestJson(
    appendPath(input.baseUrl, "models"),
    { headers: bearerHeaders(input.apiKey) },
    input,
  );
  return parseOpenAiModels(response, input.provider);
}

async function discoverAnthropicModels(
  input: RequiredDiscoveryInput,
): Promise<AiModelDescriptor[]> {
  const models: AiModelDescriptor[] = [];
  let afterId: string | undefined;
  const seenCursors = new Set<string>();
  for (;;) {
    const url = new URL(appendPath(input.baseUrl, "models"));
    url.searchParams.set("limit", "1000");
    if (afterId) url.searchParams.set("after_id", afterId);
    const response = await requestJson(
      url.toString(),
      {
        headers: {
          ...jsonHeaders(),
          "x-api-key": input.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
      },
      input,
    );
    const record = asRecord(response);
    const data = readArray(record, "data");
    if (!data) throw new AiError("AI_INVALID_RESPONSE");
    models.push(...data.flatMap((item) => normalizeAnthropicModel(item, input.provider)));
    const hasMore = readBoolean(record, "has_more") === true;
    const lastId = readString(record, "last_id");
    if (!hasMore) break;
    if (!lastId || seenCursors.has(lastId)) throw new AiError("AI_INVALID_RESPONSE");
    seenCursors.add(lastId);
    afterId = lastId;
  }
  return models;
}

async function discoverGeminiModels(input: RequiredDiscoveryInput): Promise<AiModelDescriptor[]> {
  const models: AiModelDescriptor[] = [];
  let pageToken: string | undefined;
  const seenTokens = new Set<string>();
  for (;;) {
    const url = new URL(appendPath(input.baseUrl, "models"));
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await requestJson(
      url.toString(),
      { headers: { ...jsonHeaders(), "x-goog-api-key": input.apiKey } },
      input,
    );
    const record = asRecord(response);
    const data = readArray(record, "models");
    if (!data) throw new AiError("AI_INVALID_RESPONSE");
    models.push(...data.flatMap((item) => normalizeGeminiModel(item, input.provider)));
    const nextPageToken = readString(record, "nextPageToken");
    if (!nextPageToken) break;
    if (seenTokens.has(nextPageToken)) throw new AiError("AI_INVALID_RESPONSE");
    seenTokens.add(nextPageToken);
    pageToken = nextPageToken;
  }
  return models;
}

async function discoverOpenRouterModels(
  input: RequiredDiscoveryInput,
): Promise<AiModelDescriptor[]> {
  const url = new URL(appendPath(input.baseUrl, "models"));
  url.searchParams.set("output_modalities", "text");
  const response = await requestJson(
    url.toString(),
    { headers: bearerHeaders(input.apiKey) },
    input,
  );
  const record = asRecord(response);
  const data = readArray(record, "data");
  if (!data) throw new AiError("AI_INVALID_RESPONSE");
  return data.flatMap((item) => normalizeOpenRouterModel(item, input.provider));
}

interface RequiredDiscoveryInput extends DiscoverModelsInput {
  baseUrl: string;
  fetcher: ModelFetcher;
  timeoutMs: number;
}

function parseOpenAiModels(value: unknown, provider: AiProvider): AiModelDescriptor[] {
  const record = asRecord(value);
  const data = Array.isArray(value) ? value : readArray(record, "data");
  if (!data) throw new AiError("AI_INVALID_RESPONSE");
  return data.flatMap((item) => normalizeOpenAiModel(item, provider));
}

function normalizeOpenAiModel(value: unknown, provider: AiProvider): AiModelDescriptor[] {
  const record = asRecord(value);
  const id = readString(record, "id");
  if (!id || isExpired(readString(record, "shutdown_date"))) return [];
  return [
    {
      id,
      displayName: id,
      provider,
      ...(readString(record, "owned_by") ? { publisher: readString(record, "owned_by") } : {}),
      ...(unixSecondsToIso(readNumber(record, "created"))
        ? { createdAt: unixSecondsToIso(readNumber(record, "created")) }
        : {}),
      source: "provider",
    },
  ];
}

function normalizeAnthropicModel(value: unknown, provider: AiProvider): AiModelDescriptor[] {
  const record = asRecord(value);
  const id = readString(record, "id");
  const type = readString(record, "type");
  if (!id || (type !== undefined && type !== "model")) return [];
  const capabilities = asRecord(record?.["capabilities"]);
  const capabilityValue = (name: string): boolean | undefined =>
    asRecord(capabilities?.[name])?.["supported"] === true ? true : undefined;
  const displayName = readString(record, "display_name") ?? id;
  const maxInputTokens = readNumber(record, "max_input_tokens");
  return [
    {
      id,
      displayName,
      provider,
      ...(unixDate(readString(record, "created_at"))
        ? { createdAt: unixDate(readString(record, "created_at")) }
        : {}),
      ...(maxInputTokens && maxInputTokens > 0 ? { contextWindow: maxInputTokens } : {}),
      capabilities: {
        text: true,
        ...(capabilityValue("image_input") ? { vision: true } : {}),
        ...(capabilityValue("tool_use") ? { tools: true } : {}),
        ...(capabilityValue("structured_outputs") ? { structuredOutput: true } : {}),
        ...(capabilityValue("thinking") ? { reasoning: true } : {}),
      },
      source: "provider",
    },
  ];
}

function normalizeGeminiModel(value: unknown, provider: AiProvider): AiModelDescriptor[] {
  const record = asRecord(value);
  const name = readString(record, "name");
  const id = readString(record, "baseModelId") ?? name?.replace(/^models\//, "");
  const methods = readStringArray(record, "supportedGenerationMethods");
  if (!id || (methods.length > 0 && !methods.includes("generateContent"))) return [];
  const inputTokenLimit = readNumber(record, "inputTokenLimit");
  const displayName = readString(record, "displayName") ?? id;
  return [
    {
      id,
      displayName,
      provider,
      ...(readString(record, "description")
        ? { description: readString(record, "description") }
        : {}),
      ...(inputTokenLimit && inputTokenLimit > 0 ? { contextWindow: inputTokenLimit } : {}),
      ...(readBoolean(record, "thinking") === true
        ? { capabilities: { text: true, reasoning: true } }
        : { capabilities: { text: true } }),
      source: "provider",
    },
  ];
}

function normalizeOpenRouterModel(value: unknown, provider: AiProvider): AiModelDescriptor[] {
  const record = asRecord(value);
  const id = readString(record, "id");
  if (!id || isExpired(readString(record, "expiration_date"))) return [];
  const architecture = asRecord(record?.["architecture"]);
  const inputModalities = readStringArray(architecture, "input_modalities");
  const outputModalities = readStringArray(architecture, "output_modalities");
  if (inputModalities.length > 0 && !inputModalities.includes("text")) return [];
  if (outputModalities.length > 0 && !outputModalities.includes("text")) return [];
  const supportedParameters = readStringArray(record, "supported_parameters");
  const pricing = asRecord(record?.["pricing"]);
  const promptPrice = readNumericString(pricing, "prompt");
  const completionPrice = readNumericString(pricing, "completion");
  return [
    {
      id,
      displayName: readString(record, "name") ?? id,
      provider,
      ...(readString(record, "description")
        ? { description: readString(record, "description") }
        : {}),
      ...(readNumber(record, "context_length")
        ? { contextWindow: readNumber(record, "context_length") }
        : {}),
      ...(inputModalities.length > 0 ? { inputModalities } : {}),
      ...(outputModalities.length > 0 ? { outputModalities } : {}),
      capabilities: {
        text: true,
        ...(inputModalities.includes("image") ? { vision: true } : {}),
        ...(supportedParameters.includes("tools") || supportedParameters.includes("tool_choice")
          ? { tools: true }
          : {}),
        ...(supportedParameters.includes("response_format") ||
        supportedParameters.includes("structured_outputs")
          ? { structuredOutput: true }
          : {}),
        ...(supportedParameters.includes("reasoning") ? { reasoning: true } : {}),
      },
      ...(promptPrice !== undefined || completionPrice !== undefined
        ? {
            pricing: {
              ...(promptPrice !== undefined ? { input: promptPrice } : {}),
              ...(completionPrice !== undefined ? { output: completionPrice } : {}),
              currency: "USD",
              unit: "USD/token",
            },
          }
        : {}),
      ...(unixSecondsToIso(readNumber(record, "created"))
        ? { createdAt: unixSecondsToIso(readNumber(record, "created")) }
        : {}),
      ...(id.includes("/") ? { publisher: id.split("/", 1)[0] } : {}),
      source: "provider",
    },
  ];
}

function filterUsableModels(models: AiModelDescriptor[]): AiModelDescriptor[] {
  const seen = new Set<string>();
  return models.filter((model) => {
    if (seen.has(model.id)) return false;
    seen.add(model.id);
    if (model.capabilities?.text === false) return false;
    if (model.inputModalities && !model.inputModalities.includes("text")) return false;
    if (model.outputModalities && !model.outputModalities.includes("text")) return false;
    return !/(embedding|moderation|transcrib|speech|audio|whisper|text-to-speech|tts|dall[-_ ]?e|image-generation|(?:^|[-_/])image(?:[-_/]|$)|realtime)/i.test(
      `${model.id} ${model.displayName}`,
    );
  });
}

async function requestJson(
  url: string,
  init: RequestInit,
  input: RequiredDiscoveryInput,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Model discovery timed out", "TimeoutError")),
    input.timeoutMs,
  );
  const onAbort = () => controller.abort(input.signal?.reason);
  if (input.signal?.aborted) controller.abort(input.signal.reason);
  else input.signal?.addEventListener("abort", onAbort, { once: true });
  try {
    if (controller.signal.aborted) {
      if (isTimeoutReason(controller.signal.reason)) throw new AiError("AI_TIMEOUT");
      throw new AiError("AI_CANCELLED");
    }
    const response = await input.fetcher(url, { ...init, signal: controller.signal });
    if (!response.ok) throw errorForStatus(response.status);
    const body = await response.text();
    try {
      return JSON.parse(body) as unknown;
    } catch (error) {
      throw new AiError("AI_INVALID_RESPONSE", error);
    }
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (controller.signal.aborted) {
      if (isTimeoutReason(controller.signal.reason)) throw new AiError("AI_TIMEOUT");
      throw new AiError("AI_CANCELLED");
    }
    throw new AiError("AI_PROVIDER_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
    input.signal?.removeEventListener("abort", onAbort);
  }
}

function errorForStatus(status: number): AiError {
  if (status === 401 || status === 403) return new AiError("AI_INVALID_CREDENTIALS");
  if (status === 404 || status === 405) return new AiError("AI_MODEL_DISCOVERY_UNAVAILABLE");
  if (status === 408 || status === 504) return new AiError("AI_TIMEOUT");
  if (status === 429) return new AiError("AI_RATE_LIMITED");
  if (status >= 500) return new AiError("AI_PROVIDER_UNAVAILABLE");
  return new AiError("AI_INVALID_RESPONSE");
}

function appendPath(baseUrl: string, path: string): string {
  try {
    const url = new URL(baseUrl);
    const pathname = url.pathname.replace(/\/+$/, "");
    url.pathname = `${pathname}/${path}`;
    return url.toString();
  } catch (error) {
    throw new AiError("AI_MODEL_DISCOVERY_UNAVAILABLE", error);
  }
}

function bearerHeaders(apiKey: string): Record<string, string> {
  return { ...jsonHeaders(), authorization: `Bearer ${apiKey}` };
}

function jsonHeaders(): Record<string, string> {
  return { accept: "application/json" };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readArray(record: Record<string, unknown> | null, key: string): unknown[] | null {
  return record && Array.isArray(record[key]) ? record[key] : null;
}

function readString(record: Record<string, unknown> | null, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readStringArray(record: Record<string, unknown> | null, key: string): string[] {
  const value = record?.[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readNumber(record: Record<string, unknown> | null, key: string): number | undefined {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readNumericString(
  record: Record<string, unknown> | null,
  key: string,
): number | undefined {
  const value = record?.[key];
  const number =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function readBoolean(record: Record<string, unknown> | null, key: string): boolean | undefined {
  const value = record?.[key];
  return typeof value === "boolean" ? value : undefined;
}

function unixSecondsToIso(value: number | undefined): string | undefined {
  if (value === undefined || value <= 0) return undefined;
  const date = new Date(value * 1_000);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function unixDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function isExpired(value: string | undefined): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}

function isTimeoutReason(reason: unknown): boolean {
  return Boolean(
    reason && typeof reason === "object" && (reason as { name?: unknown }).name === "TimeoutError",
  );
}
