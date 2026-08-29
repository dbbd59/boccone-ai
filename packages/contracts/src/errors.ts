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
