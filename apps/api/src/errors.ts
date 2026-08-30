import type { ApiErrorCode, ErrorResponse } from "@boccone/contracts";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  internal_error: 500,
  ai_not_configured: 503,
  ai_invalid_credentials: 502,
  ai_rate_limited: 429,
  ai_provider_unavailable: 503,
  ai_model_not_found: 502,
  ai_model_not_accessible: 502,
  ai_model_not_selected: 400,
  ai_model_discovery_unavailable: 503,
  ai_model_unsupported: 400,
  ai_timeout: 504,
  ai_cancelled: 499,
  ai_invalid_response: 502,
  ai_secret_unavailable: 503,
  ai_unknown_error: 500,
};

/** Domain error carrying a machine-readable contract code + HTTP status. */
export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}

export function errorBody(code: ApiErrorCode, message: string, requestId?: string): ErrorResponse {
  return {
    error: {
      code,
      message,
      ...(requestId ? { requestId } : {}),
    },
  };
}

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
