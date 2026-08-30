import { Elysia, type AnyElysia } from "elysia";

import { mealInterpretationRequestSchema, updateAiSettingsSchema } from "@boccone/contracts";
import type { BocconeAuth } from "@boccone/auth";

import { requireSession } from "../middleware/auth";
import type { AiService } from "../services/ai";
import { getRequest, type RouteContext } from "./context";

export function createAiRoutes(auth: BocconeAuth, ai: AiService): AnyElysia {
  const routes: AnyElysia = new Elysia({ name: "boccone-ai-routes" });

  routes.get("/api/me/ai/settings", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    return ai.getSettings(session.user.id);
  });

  routes.put("/api/me/ai/settings", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    return ai.updateSettings(session.user.id, updateAiSettingsSchema.parse(context.body));
  });

  routes.delete("/api/me/ai/settings/api-key", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    return ai.deleteApiKey(session.user.id);
  });

  routes.get("/api/me/ai/models", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const refresh = new URL(request.url).searchParams.get("refresh") === "true";
    return ai.discoverModels(session.user.id, refresh);
  });

  routes.post("/api/me/ai/test-connection", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    return ai.testConnection(session.user.id, requestId(request));
  });

  routes.post("/api/me/ai/interpret-meal", async (context: RouteContext) => {
    const request = getRequest(context);
    const session = await requireSession(auth, request);
    const input = mealInterpretationRequestSchema.parse(context.body);
    const abortController = new AbortController();
    const abort = () => abortController.abort();
    request.signal.addEventListener("abort", abort, { once: true });
    try {
      return await ai.interpretMeal(session.user.id, requestId(request), input, abortController);
    } finally {
      request.signal.removeEventListener("abort", abort);
    }
  });

  return routes;
}

function requestId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
