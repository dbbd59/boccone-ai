import { Elysia } from "elysia";

import type { Logger } from "../logger";

/** Request-scoped trace id. Never logs headers or request bodies. */
export function createRequestContext() {
  return new Elysia({ name: "boccone-request-context" }).derive(({ request, set }) => {
    const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    set.headers["X-Request-Id"] = requestId;
    return { requestId };
  });
}

/** Structured request logging, kept separate from route/business modules. */
export function createRequestLogging(logger: Logger) {
  return new Elysia({ name: "boccone-request-logging" }).onAfterHandle(({ request, response }) => {
      const status = response instanceof Response ? response.status : 200;
      const requestId = request.headers.get("x-request-id") ?? "unknown";
      const fields = {
        method: request.method,
        path: new URL(request.url).pathname,
        status,
      };
      const requestLogger = logger.child({ requestId });
      if (status >= 500) requestLogger.error("request completed", fields);
      else if (status >= 400) requestLogger.warn("request completed", fields);
      else requestLogger.debug("request completed", fields);
    });
}
