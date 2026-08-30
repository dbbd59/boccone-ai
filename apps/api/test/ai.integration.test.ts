import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import {
  AiError,
  type AiHarness,
  type AiModelDescriptor,
  type RunStructuredInput,
  type RunTextInput,
} from "@boccone/ai";
import {
  adminAiUsageResponseSchema,
  aiModelsResponseSchema,
  aiSettingsResponseSchema,
  errorResponseSchema,
  mealDraftResponseSchema,
} from "@boccone/contracts";
import { aiProviderConfigs, eq, meals, user } from "@boccone/db";

import { createCookieJar, createTestHarness, uniqueEmail, type TestHarness } from "./helpers";

let harness: TestHarness;

beforeAll(async () => {
  harness = await createTestHarness();
});

afterAll(async () => {
  if (harness) await harness.cleanup();
});

describe("AI meal drafting", () => {
  test("uses JSON extraction without catalog tools for OpenRouter", async () => {
    let receivedTools: unknown = "not-called";
    const aiHarness: AiHarness = {
      runStructured<T>(input: RunStructuredInput<T>) {
        receivedTools = input.tools;
        return Promise.resolve({
          output: input.outputSchema.parse({
            mealType: "lunch",
            foods: [
              { sourceText: "80 g di pasta", normalizedName: "pasta", grams: 80, confidence: 0.9 },
            ],
          }),
          record: {
            context: input.context,
            status: "succeeded" as const,
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            latencyMs: 0,
            errorCode: null,
            providerRequestId: null,
          },
        });
      },
      runText(input: RunTextInput) {
        return Promise.resolve({
          text: "OK",
          record: {
            context: input.context,
            status: "succeeded" as const,
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            latencyMs: 0,
            errorCode: null,
            providerRequestId: null,
          },
        });
      },
    };
    const localHarness = await createTestHarness({ harness: aiHarness });

    try {
      const jar = createCookieJar();
      const signUp = await localHarness.app.handle(
        new Request("http://localhost/api/auth/sign-up/email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "OpenRouter User",
            email: uniqueEmail("ai-openrouter"),
            password: "correct-horse-42",
          }),
        }),
      );
      jar.capture(signUp);
      expect(signUp.status).toBe(200);

      const save = await requestWithCookieFor(localHarness, jar, "/api/me/ai/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "openrouter",
          model: "openrouter/free",
          apiKey: "sk-or-test-secret",
        }),
      });
      expect(save.status).toBe(200);

      const response = await requestWithCookieFor(localHarness, jar, "/api/me/ai/interpret-meal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "80 g di pasta", locale: "it", timezone: "Europe/Rome" }),
      });
      expect(response.status).toBe(200);
      expect(receivedTools).toBeUndefined();
    } finally {
      await localHarness.cleanup();
    }
  });

  test("keeps settings secret and returns a reviewable draft without creating a meal", async () => {
    const jar = createCookieJar();
    const email = uniqueEmail("ai");
    const signUp = await harness.app.handle(
      new Request("http://localhost/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "AI User", email, password: "correct-horse-42" }),
      }),
    );
    jar.capture(signUp);
    expect(signUp.status).toBe(200);

    const saveSettings = await requestWithCookie(jar, "/api/me/ai/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: "openai", model: "gpt-5-mini", apiKey: "sk-test-secret" }),
    });
    expect(saveSettings.status).toBe(200);
    const settings = aiSettingsResponseSchema.parse(await saveSettings.json());
    expect(settings.settings?.hasApiKey).toBe(true);
    expect(JSON.stringify(settings)).not.toContain("sk-test-secret");

    const userRows = await harness.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email));
    const userId = userRows[0]?.id;
    if (!userId) throw new Error("test user was not created");
    const configRows = await harness.db
      .select()
      .from(aiProviderConfigs)
      .where(eq(aiProviderConfigs.userId, userId));
    expect(configRows[0]?.encryptedApiKey).toBeTruthy();
    expect(configRows[0]?.encryptedApiKey).not.toContain("sk-test-secret");

    const draftResponse = await requestWithCookie(jar, "/api/me/ai/interpret-meal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "80 g di pasta", locale: "it", timezone: "Europe/Rome" }),
    });
    expect(draftResponse.status).toBe(200);
    const draft = mealDraftResponseSchema.parse(await draftResponse.json());
    expect(draft.draft.foods[0]?.resolutionStatus).toBe("UNRESOLVED");

    const mealRows = await harness.db.select().from(meals).where(eq(meals.userId, userId));
    expect(mealRows).toHaveLength(0);
  });

  test("requires authentication and exposes only safe usage metadata to admins", async () => {
    const unauthenticated = await harness.app.handle(
      new Request("http://localhost/api/me/ai/settings"),
    );
    expect(unauthenticated.status).toBe(401);

    const adminJar = createCookieJar();
    const email = uniqueEmail("admin-ai");
    const signUp = await harness.app.handle(
      new Request("http://localhost/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Admin", email, password: "correct-horse-42" }),
      }),
    );
    adminJar.capture(signUp);
    const [admin] = await harness.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email));
    if (!admin) throw new Error("admin user was not created");
    await harness.db.update(user).set({ role: "admin" }).where(eq(user.id, admin.id));

    const response = await requestWithCookie(adminJar, "/api/admin/ai/usage");
    expect(response.status).toBe(200);
    const usage = adminAiUsageResponseSchema.parse(await response.json());
    expect(usage.usage.every((item) => !JSON.stringify(item).includes("sk-test-secret"))).toBe(
      true,
    );
  });
});

describe("AI model discovery", () => {
  test("discovers, caches, serves stale models, and keeps manual ids usable", async () => {
    let calls = 0;
    const discovered: AiModelDescriptor[] = [
      {
        id: "provider-model-2030",
        displayName: "Provider model 2030",
        provider: "openai",
        source: "provider",
      },
    ];
    const localHarness = await createTestHarness({
      modelDiscovery: (input) => {
        calls += 1;
        expect(input.provider).toBe("openai");
        expect(input.apiKey).toBe("discovery-secret");
        if (calls === 2) return Promise.reject(new AiError("AI_PROVIDER_UNAVAILABLE"));
        return Promise.resolve(discovered);
      },
    });

    try {
      const jar = createCookieJar();
      const signUp = await localHarness.app.handle(
        new Request("http://localhost/api/auth/sign-up/email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "Discovery User",
            email: uniqueEmail("ai-discovery"),
            password: "correct-horse-42",
          }),
        }),
      );
      jar.capture(signUp);
      expect(signUp.status).toBe(200);

      const save = await requestWithCookieFor(localHarness, jar, "/api/me/ai/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "openai", apiKey: "discovery-secret" }),
      });
      expect(save.status).toBe(200);
      const savedSettings = aiSettingsResponseSchema.parse(await save.json());
      expect(savedSettings.settings?.model).toBeNull();

      const first = await requestWithCookieFor(localHarness, jar, "/api/me/ai/models");
      expect(first.status).toBe(200);
      expect(aiModelsResponseSchema.parse(await first.json())).toMatchObject({
        provider: "openai",
        stale: false,
        models: discovered,
      });
      expect(calls).toBe(1);

      const cached = await requestWithCookieFor(localHarness, jar, "/api/me/ai/models");
      expect(cached.status).toBe(200);
      expect(calls).toBe(1);

      const stale = await requestWithCookieFor(localHarness, jar, "/api/me/ai/models?refresh=true");
      expect(stale.status).toBe(200);
      expect(aiModelsResponseSchema.parse(await stale.json())).toMatchObject({
        stale: true,
        models: discovered,
      });
      expect(calls).toBe(2);

      const saveManual = await requestWithCookieFor(localHarness, jar, "/api/me/ai/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "openai", model: "private-model-alias" }),
      });
      expect(saveManual.status).toBe(200);
      const manualSettings = aiSettingsResponseSchema.parse(await saveManual.json());
      expect(manualSettings.settings?.model).toBe("private-model-alias");

      const afterManual = await requestWithCookieFor(localHarness, jar, "/api/me/ai/models");
      expect(afterManual.status).toBe(200);
      expect(calls).toBe(3);
    } finally {
      await localHarness.cleanup();
    }
  });

  test("requires authentication", async () => {
    const response = await harness.app.handle(new Request("http://localhost/api/me/ai/models"));
    expect(response.status).toBe(401);
  });
});

describe("AI settings encryption", () => {
  test("returns a safe configuration error when encryption is unavailable", async () => {
    const localHarness = await createTestHarness({ encryptionKey: null });

    try {
      const jar = createCookieJar();
      const signUp = await localHarness.app.handle(
        new Request("http://localhost/api/auth/sign-up/email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "Encryption User",
            email: uniqueEmail("ai-encryption"),
            password: "correct-horse-42",
          }),
        }),
      );
      jar.capture(signUp);
      expect(signUp.status).toBe(200);

      const response = await requestWithCookieFor(localHarness, jar, "/api/me/ai/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "openai", model: "gpt-5-mini", apiKey: "sk-test-secret" }),
      });

      expect(response.status).toBe(503);
      const body = errorResponseSchema.parse(await response.json());
      expect(body.error.code).toBe("ai_secret_unavailable");
      expect(body.error.message).toBe("AI encryption is not configured");
      expect(JSON.stringify(body)).not.toContain("sk-test-secret");
    } finally {
      await localHarness.cleanup();
    }
  });
});

function requestWithCookie(
  jar: ReturnType<typeof createCookieJar>,
  path: string,
  init: RequestInit = {},
) {
  return harness.app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: { ...init.headers, Cookie: jar.header() },
    }),
  );
}

function requestWithCookieFor(
  target: TestHarness,
  jar: ReturnType<typeof createCookieJar>,
  path: string,
  init: RequestInit = {},
) {
  return target.app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: { ...init.headers, Cookie: jar.header() },
    }),
  );
}
