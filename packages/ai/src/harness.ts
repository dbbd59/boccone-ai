import {
  chat,
  type AnyServerTool,
  type AnyTextAdapter,
  type ChatMiddleware,
  type ModelMessage,
} from "@tanstack/ai";
import { createAnthropicChat } from "@tanstack/ai-anthropic";
import { createGeminiChat } from "@tanstack/ai-gemini";
import { createOpenaiChatCompletions } from "@tanstack/ai-openai";
import { openaiCompatibleText } from "@tanstack/ai-openai/compatible";
import { createOpenRouterText, type OpenRouterConfig } from "@tanstack/ai-openrouter";
import type { z } from "zod";

import { AiError, normalizeAiError, type AiErrorCode } from "./errors";
import { type AiFeature, type AiProvider, validateModelSelection } from "./registry";

export interface AiInvocationContext {
  userId: string;
  feature: AiFeature;
  provider: AiProvider;
  model: string;
  locale: "en" | "it";
  timezone: string;
  requestId: string;
}

export interface AiUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface AiInvocationRecord {
  context: AiInvocationContext;
  status: "succeeded" | "failed" | "cancelled";
  usage: AiUsage;
  latencyMs: number;
  errorCode: AiErrorCode | null;
  providerRequestId: string | null;
}

export interface RunStructuredInput<T> {
  context: AiInvocationContext;
  apiKey: string;
  baseUrl?: string | null;
  messages: ModelMessage[];
  systemPrompt?: string;
  outputSchema: z.ZodType<T>;
  tools?: readonly AnyServerTool[];
  abortController?: AbortController;
  timeoutMs?: number;
}

export interface RunTextInput {
  context: AiInvocationContext;
  apiKey: string;
  baseUrl?: string | null;
  messages: ModelMessage[];
  systemPrompt?: string;
  abortController?: AbortController;
  timeoutMs?: number;
}

export interface AiHarness {
  runStructured<T>(
    input: RunStructuredInput<T>,
  ): Promise<{ output: T; record: AiInvocationRecord }>;
  runText(input: RunTextInput): Promise<{ text: string; record: AiInvocationRecord }>;
}

export interface CreateAiHarnessOptions {
  onInvocation?: (record: AiInvocationRecord) => Promise<void> | void;
}

export function createAiHarness(options: CreateAiHarnessOptions = {}): AiHarness {
  return {
    runStructured: (input) => runStructured(input, options.onInvocation),
    runText: (input) => runText(input, options.onInvocation),
  };
}

export interface MockAiHarnessOptions {
  structuredResponse?: unknown;
  textResponse?: string;
  error?: AiError;
  onInvocation?: (record: AiInvocationRecord) => Promise<void> | void;
}

/** Deterministic seam for unit/integration tests; never calls a paid provider. */
export function createMockAiHarness(options: MockAiHarnessOptions): AiHarness {
  return {
    async runStructured<T>(input: RunStructuredInput<T>) {
      const startedAt = performance.now();
      const record = baseRecord(input.context);
      try {
        if (options.error) throw options.error;
        const output = input.outputSchema.parse(options.structuredResponse);
        record.status = "succeeded";
        record.latencyMs = Math.round(performance.now() - startedAt);
        await notifyInvocation(options.onInvocation, record);
        return { output, record };
      } catch (error) {
        const normalized = normalizeAiError(error);
        record.status = normalized.code === "AI_CANCELLED" ? "cancelled" : "failed";
        record.errorCode = normalized.code;
        record.latencyMs = Math.round(performance.now() - startedAt);
        await notifyInvocation(options.onInvocation, record);
        throw normalized;
      }
    },
    async runText(input: RunTextInput) {
      const startedAt = performance.now();
      const record = baseRecord(input.context);
      try {
        if (options.error) throw options.error;
        record.status = "succeeded";
        record.latencyMs = Math.round(performance.now() - startedAt);
        await notifyInvocation(options.onInvocation, record);
        return { text: options.textResponse ?? "OK", record };
      } catch (error) {
        const normalized = normalizeAiError(error);
        record.status = normalized.code === "AI_CANCELLED" ? "cancelled" : "failed";
        record.errorCode = normalized.code;
        record.latencyMs = Math.round(performance.now() - startedAt);
        await notifyInvocation(options.onInvocation, record);
        throw normalized;
      }
    },
  };
}

async function runStructured<T>(
  input: RunStructuredInput<T>,
  onInvocation?: (record: AiInvocationRecord) => Promise<void> | void,
) {
  const startedAt = performance.now();
  const record = baseRecord(input.context);
  const usage = createUsageAccumulator();
  const controller = createLinkedController(input.abortController, input.timeoutMs ?? 20_000);
  try {
    assertUsableSelection(input.context.provider, input.context.model);
    const adapter = createTextAdapter({
      provider: input.context.provider,
      model: input.context.model,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
      recoverMealStructuredOutput: input.context.feature === "MEAL_NATURAL_LANGUAGE",
    });
    if (input.context.provider === "openrouter") {
      // Free-routed models can leave OpenRouter's native structured stream
      // open. Force the adapter's non-streaming JSON request instead.
      adapter.structuredOutputStream = undefined;
    }
    const output = await withProviderRetry(
      () =>
        chat({
          adapter,
          messages: input.messages,
          systemPrompts: input.systemPrompt ? [input.systemPrompt] : undefined,
          tools: input.tools,
          outputSchema: input.outputSchema,
          middleware: [usageMiddleware(usage)],
          abortController: controller,
        }),
      controller,
    );
    const parsed = input.outputSchema.parse(output);
    record.status = "succeeded";
    record.usage = usage.value();
    record.latencyMs = Math.round(performance.now() - startedAt);
    await notifyInvocation(onInvocation, record);
    return { output: parsed, record };
  } catch (error) {
    const normalized = normalizeHarnessError(error, controller.signal);
    record.status = normalized.code === "AI_CANCELLED" ? "cancelled" : "failed";
    record.errorCode = normalized.code;
    record.usage = usage.value();
    record.latencyMs = Math.round(performance.now() - startedAt);
    await notifyInvocation(onInvocation, record);
    throw normalized;
  } finally {
    controller.abort();
  }
}

async function runText(
  input: RunTextInput,
  onInvocation?: (record: AiInvocationRecord) => Promise<void> | void,
) {
  const startedAt = performance.now();
  const record = baseRecord(input.context);
  const usage = createUsageAccumulator();
  const controller = createLinkedController(input.abortController, input.timeoutMs ?? 10_000);
  try {
    assertUsableSelection(input.context.provider, input.context.model);
    const adapter = createTextAdapter({
      provider: input.context.provider,
      model: input.context.model,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
    });
    const text = await withProviderRetry(
      () =>
        chat({
          adapter,
          messages: input.messages,
          systemPrompts: input.systemPrompt ? [input.systemPrompt] : undefined,
          stream: false,
          middleware: [usageMiddleware(usage)],
          abortController: controller,
        }),
      controller,
    );
    record.status = "succeeded";
    record.usage = usage.value();
    record.latencyMs = Math.round(performance.now() - startedAt);
    await notifyInvocation(onInvocation, record);
    return { text, record };
  } catch (error) {
    const normalized = normalizeHarnessError(error, controller.signal);
    record.status = normalized.code === "AI_CANCELLED" ? "cancelled" : "failed";
    record.errorCode = normalized.code;
    record.usage = usage.value();
    record.latencyMs = Math.round(performance.now() - startedAt);
    await notifyInvocation(onInvocation, record);
    throw normalized;
  } finally {
    controller.abort();
  }
}

function createTextAdapter(input: {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string | null;
  recoverMealStructuredOutput?: boolean;
}): AnyTextAdapter {
  const model = input.model as never;
  switch (input.provider) {
    case "openai":
      return createOpenaiChatCompletions(
        model,
        input.apiKey,
        input.baseUrl ? { baseURL: input.baseUrl } : undefined,
      ) as unknown as AnyTextAdapter;
    case "anthropic":
      return createAnthropicChat(
        model,
        input.apiKey,
        input.baseUrl ? { baseURL: input.baseUrl } : undefined,
      ) as unknown as AnyTextAdapter;
    case "gemini":
      return createGeminiChat(
        model,
        input.apiKey,
        input.baseUrl ? { httpOptions: { baseUrl: input.baseUrl } } : undefined,
      );
    case "openrouter":
      return createOpenRouterText(model, input.apiKey, {
        ...(input.baseUrl ? { serverURL: input.baseUrl } : {}),
        ...(input.recoverMealStructuredOutput
          ? { httpClient: createOpenRouterRecoveryClient() }
          : {}),
      }) as unknown as AnyTextAdapter;
    case "openai-compatible":
      if (!input.baseUrl) throw new AiError("AI_MODEL_UNSUPPORTED");
      return openaiCompatibleText(input.model, { baseURL: input.baseUrl, apiKey: input.apiKey });
  }
}

function createOpenRouterRecoveryClient(): NonNullable<OpenRouterConfig["httpClient"]> {
  return {
    request: async (request) => {
      const response = await fetch(await withJsonObjectMode(request));
      if (!response.ok || !isJsonResponse(response)) return response;

      let body: unknown;
      try {
        body = await response.clone().json();
      } catch {
        return response;
      }
      const recovered = recoverMealStructuredResponse(body);
      if (!recovered) return response;

      const headers = new Headers(response.headers);
      headers.delete("content-length");
      return new Response(JSON.stringify(recovered), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  } as NonNullable<OpenRouterConfig["httpClient"]>;
}

async function withJsonObjectMode(request: Request): Promise<Request> {
  if (request.method !== "POST" || !isJsonRequest(request)) return request;

  let body: unknown;
  try {
    body = await request.clone().json();
  } catch {
    return request;
  }
  if (!isRecord(body) || !isRecord(body["response_format"])) return request;

  const headers = new Headers(request.headers);
  headers.delete("content-length");
  return new Request(request, {
    body: JSON.stringify({ ...body, response_format: { type: "json_object" } }),
    headers,
  });
}

function isJsonRequest(request: Request): boolean {
  return request.headers.get("content-type")?.toLowerCase().includes("application/json") ?? false;
}

function isJsonResponse(response: Response): boolean {
  return response.headers.get("content-type")?.toLowerCase().includes("application/json") ?? false;
}

function recoverMealStructuredResponse(body: unknown): Record<string, unknown> | null {
  if (!isRecord(body)) return null;
  const choices = body["choices"];
  if (!isUnknownArray(choices)) return null;
  const firstChoice = choices[0];
  if (!isRecord(firstChoice)) return null;
  const firstMessage = firstChoice["message"];
  if (!isRecord(firstMessage)) return null;
  const content = firstMessage["content"];
  if (typeof content !== "string") return null;

  const parsed = parseJsonWithCodeFence(content);
  if (!isRecord(parsed)) return null;
  const normalized = trimObjectKeys(parsed);
  if (!isRecord(normalized)) return null;
  const foodsValue = normalized["foods"];
  if (!isUnknownArray(foodsValue)) return null;

  const foods = foodsValue.map((food) => recoverMealFood(food));
  const nextChoices = choices.map((choice, index) => {
    if (index !== 0 || !isRecord(choice)) return choice;
    const message = choice["message"];
    if (!isRecord(message)) return choice;
    return {
      ...choice,
      message: { ...message, content: JSON.stringify({ ...normalized, foods }) },
    };
  });
  return { ...body, choices: nextChoices };
}

function recoverMealFood(value: unknown): unknown {
  const food = trimObjectKeys(value);
  if (!isRecord(food)) return food;
  const portion = toLegacyMealPortion(food["portion"]);
  const name = typeof food["name"] === "string" ? food["name"] : undefined;
  const recovered: Record<string, unknown> = { ...food };
  if (food["sourceText"] === undefined && name !== undefined) recovered["sourceText"] = name;
  if (food["normalizedName"] === undefined && name !== undefined)
    recovered["normalizedName"] = name;
  if (portion && food["quantity"] === undefined && typeof portion.quantity === "number")
    recovered["quantity"] = portion.quantity;
  if (portion && food["unit"] === undefined && typeof portion.unit === "string")
    recovered["unit"] = portion.unit;
  if (
    portion &&
    food["portionDescription"] === undefined &&
    typeof portion.description === "string"
  )
    recovered["portionDescription"] = portion.description;
  return recovered;
}

function toLegacyMealPortion(value: unknown): LegacyMealPortion | null {
  const portion = trimObjectKeys(value);
  if (!isRecord(portion)) return null;
  return {
    quantity: portion["quantity"],
    unit: portion["unit"],
    description: portion["description"],
  };
}

function parseJsonWithCodeFence(content: string): unknown {
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed)?.[1] ?? trimmed;
  try {
    return JSON.parse(fenced);
  } catch {
    return null;
  }
}

function trimObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(trimObjectKeys);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key.trim(), trimObjectKeys(nested)]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

interface LegacyMealPortion {
  quantity?: unknown;
  unit?: unknown;
  description?: unknown;
}

function assertUsableSelection(provider: AiProvider, model: string): void {
  if (!validateModelSelection(provider, model)) throw new AiError("AI_MODEL_UNSUPPORTED");
}

function baseRecord(context: AiInvocationContext): AiInvocationRecord {
  return {
    context,
    status: "failed",
    usage: { inputTokens: null, outputTokens: null, totalTokens: null },
    latencyMs: 0,
    errorCode: null,
    providerRequestId: null,
  };
}

function createUsageAccumulator() {
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let totalTokens: number | null = null;
  return {
    add(usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number }) {
      if (typeof usage.promptTokens === "number")
        inputTokens = (inputTokens ?? 0) + usage.promptTokens;
      if (typeof usage.completionTokens === "number")
        outputTokens = (outputTokens ?? 0) + usage.completionTokens;
      if (typeof usage.totalTokens === "number")
        totalTokens = (totalTokens ?? 0) + usage.totalTokens;
    },
    value(): AiUsage {
      return { inputTokens, outputTokens, totalTokens };
    },
  };
}

function usageMiddleware(accumulator: ReturnType<typeof createUsageAccumulator>): ChatMiddleware {
  return {
    name: "boccone-ai-usage",
    onUsage: (_context, usage) => accumulator.add(usage),
  };
}

function createLinkedController(
  parent: AbortController | undefined,
  timeoutMs: number,
): AbortController {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("AI request timed out", "TimeoutError")),
    timeoutMs,
  );
  parent?.signal.addEventListener("abort", () => controller.abort(parent.signal.reason), {
    once: true,
  });
  controller.signal.addEventListener("abort", () => clearTimeout(timeout), { once: true });
  return controller;
}

function normalizeHarnessError(error: unknown, signal: AbortSignal): AiError {
  if (signal.aborted) {
    return isTimeoutReason(signal.reason) ? new AiError("AI_TIMEOUT") : new AiError("AI_CANCELLED");
  }
  return normalizeAiError(error);
}

function isTimeoutReason(reason: unknown): boolean {
  return Boolean(
    reason && typeof reason === "object" && (reason as { name?: unknown }).name === "TimeoutError",
  );
}

async function withProviderRetry<T>(
  operation: () => Promise<T>,
  controller: AbortController,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const normalized = normalizeAiError(error);
      if (
        attempt > 0 ||
        (normalized.code !== "AI_PROVIDER_UNAVAILABLE" && normalized.code !== "AI_INVALID_RESPONSE")
      )
        throw error;
      await abortableDelay(200, controller.signal);
    }
  }
}

function abortableDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(abortReasonError(signal.reason));
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(abortReasonError(signal.reason));
      },
      { once: true },
    );
  });
}

function abortReasonError(reason: unknown): AiError {
  return reason &&
    typeof reason === "object" &&
    (reason as { name?: unknown }).name === "TimeoutError"
    ? new AiError("AI_TIMEOUT", reason)
    : new AiError("AI_CANCELLED", reason);
}

async function notifyInvocation(
  onInvocation: ((record: AiInvocationRecord) => Promise<void> | void) | undefined,
  record: AiInvocationRecord,
): Promise<void> {
  try {
    await onInvocation?.(record);
  } catch {
    // Telemetry must never change the provider-facing result.
  }
}
