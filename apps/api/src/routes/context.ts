import { AppError } from "../errors";

export interface RouteContext {
  request?: unknown;
  params?: unknown;
  body?: unknown;
}

export function getRequest(context: RouteContext): Request {
  if (!(context.request instanceof Request)) {
    throw new AppError("internal_error", "Request context is unavailable");
  }
  return context.request;
}
