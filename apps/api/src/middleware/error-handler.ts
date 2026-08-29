import { ValidationError as ElysiaValidationError } from "elysia";
import { ZodError } from "zod";

import { AppError, errorBody, jsonResponse } from "../errors";
import type { Logger } from "../logger";

type ErrorHookContext = {
  code: unknown;
  error: unknown;
  request: Request;
  requestId?: string;
};

/** Single error funnel. Client errors get contracts; 5xx errors get redacted logs. */
export function createErrorHandler(logger: Logger) {
  return ({ code, error, request, requestId }: ErrorHookContext): Response => {
    const id = requestId ?? request.headers.get("x-request-id") ?? undefined;

    if (error instanceof AppError) {
      return jsonResponse(errorBody(error.code, error.message, id), error.status);
    }

    if (error instanceof ZodError || error instanceof ElysiaValidationError || code === "VALIDATION") {
      return jsonResponse(errorBody("validation_error", "Validation failed", id), 400);
    }

    if (code === "NOT_FOUND") {
      return jsonResponse(errorBody("not_found", "Route not found", id), 404);
    }

    logger.error("unhandled error", { requestId: id, error });
    return jsonResponse(errorBody("internal_error", "Internal server error", id), 500);
  };
}
