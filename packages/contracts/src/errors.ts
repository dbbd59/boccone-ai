import { z } from "zod";

/**
 * Machine-readable error codes returned by the Boccone API.
 * Clients should branch on `code`, never on `message`.
 */
export const apiErrorCodeSchema = z.enum([
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "validation_error",
  "internal_error",
  "ai_not_configured",
  "ai_invalid_credentials",
  "ai_rate_limited",
  "ai_provider_unavailable",
  "ai_model_not_found",
  "ai_model_not_accessible",
  "ai_model_not_selected",
  "ai_model_discovery_unavailable",
  "ai_model_unsupported",
  "ai_timeout",
  "ai_cancelled",
  "ai_invalid_response",
  "ai_secret_unavailable",
  "ai_unknown_error",
]);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const errorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    requestId: z.string().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
