export type AiErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_INVALID_CREDENTIALS"
  | "AI_RATE_LIMITED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_MODEL_NOT_FOUND"
  | "AI_MODEL_NOT_ACCESSIBLE"
  | "AI_MODEL_NOT_SELECTED"
  | "AI_MODEL_DISCOVERY_UNAVAILABLE"
  | "AI_MODEL_UNSUPPORTED"
  | "AI_TIMEOUT"
  | "AI_CANCELLED"
  | "AI_INVALID_RESPONSE"
  | "AI_SECRET_UNAVAILABLE"
  | "AI_UNKNOWN_ERROR";

const SAFE_MESSAGES: Record<AiErrorCode, string> = {
  AI_NOT_CONFIGURED: "AI provider is not configured",
  AI_INVALID_CREDENTIALS: "AI provider credentials are invalid",
  AI_RATE_LIMITED: "AI provider rate limit reached",
  AI_PROVIDER_UNAVAILABLE: "AI provider is unavailable",
  AI_MODEL_NOT_FOUND: "AI model was not found",
  AI_MODEL_NOT_ACCESSIBLE: "AI model is not accessible with these credentials",
  AI_MODEL_NOT_SELECTED: "Select an AI model first",
  AI_MODEL_DISCOVERY_UNAVAILABLE: "AI provider model discovery is unavailable",
  AI_MODEL_UNSUPPORTED: "AI model is not supported",
  AI_TIMEOUT: "AI request timed out",
  AI_CANCELLED: "AI request was cancelled",
  AI_INVALID_RESPONSE: "AI provider returned an invalid response",
  AI_SECRET_UNAVAILABLE: "AI encryption is not configured",
  AI_UNKNOWN_ERROR: "AI request failed",
};

export class AiError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode, cause?: unknown) {
    super(SAFE_MESSAGES[code], { cause });
    this.name = "AiError";
    this.code = code;
  }
}

/** Convert arbitrary provider exceptions into a stable, secret-free error. */
export function normalizeAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (isTimeoutError(error)) return new AiError("AI_TIMEOUT");
  if (isAbortError(error)) return new AiError("AI_CANCELLED");
  if (isRateLimitError(error)) return new AiError("AI_RATE_LIMITED");

  const status = readStatus(error);
  if (status === 401) return new AiError("AI_INVALID_CREDENTIALS");
  if (status === 403) return new AiError("AI_MODEL_NOT_ACCESSIBLE");
  if (status === 404) return new AiError("AI_MODEL_NOT_FOUND");
  if (status === 400) return new AiError("AI_MODEL_NOT_ACCESSIBLE");
  if (status === 408 || status === 504) return new AiError("AI_TIMEOUT");
  if (status === 429) return new AiError("AI_RATE_LIMITED");
  if (status !== undefined && status >= 500) return new AiError("AI_PROVIDER_UNAVAILABLE");
  if (isStructuredOutputError(error)) return new AiError("AI_INVALID_RESPONSE");
  return new AiError("AI_UNKNOWN_ERROR");
}

export function safeAiMessage(code: AiErrorCode): string {
  return SAFE_MESSAGES[code];
}

function readStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = (error as { status?: unknown }).status;
  return typeof value === "number" ? value : undefined;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    Boolean(
      error && typeof error === "object" && (error as { name?: unknown }).name === "AbortError",
    )
  );
}

function isTimeoutError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "TimeoutError") ||
    Boolean(
      error && typeof error === "object" && (error as { name?: unknown }).name === "TimeoutError",
    )
  );
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = (error as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    /rate limit|too many requests|quota exceeded|free-models-per-day/i.test(message)
  );
}

function isStructuredOutputError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: unknown }).name;
  const message = (error as { message?: unknown }).message;
  const code = (error as { code?: unknown }).code;
  const cause = (error as { cause?: unknown }).cause;
  return (
    (typeof name === "string" && /schema|parse|json|validation/i.test(name)) ||
    (typeof message === "string" && /response validation|structured output/i.test(message)) ||
    name === "ZodError" ||
    (typeof code === "string" && code.startsWith("structured-output-")) ||
    Array.isArray((error as { issues?: unknown }).issues) ||
    (cause !== undefined && isStructuredOutputError(cause))
  );
}
