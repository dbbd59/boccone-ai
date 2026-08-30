import { describe, expect, it } from "bun:test";

import { discoverModels, validateModelSelection } from "../src";

describe("AI model discovery", () => {
  it("normalizes OpenAI models, preserves new ids, and sends bearer auth", async () => {
    let request: { url: string; authorization: string | null } | undefined;
    const models = await discoverModels({
      provider: "openai",
      apiKey: "openai-secret",
      fetcher: (input, init) => {
        request = {
          url: requestUrl(input),
          authorization: new Headers(init?.headers).get("authorization"),
        };
        return Promise.resolve(
          jsonResponse({
            object: "list",
            data: [
              { id: "totally-new-provider-model-2030", created: 1_800_000_000, owned_by: "future" },
              { id: "text-embedding-new", created: 1_800_000_000, owned_by: "future" },
              { id: "gpt-image-1", created: 1_800_000_000, owned_by: "future" },
            ],
          }),
        );
      },
    });

    expect(request?.url).toBe("https://api.openai.com/v1/models");
    expect(request?.authorization).toBe("Bearer openai-secret");
    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      id: "totally-new-provider-model-2030",
      displayName: "totally-new-provider-model-2030",
      provider: "openai",
      source: "provider",
      publisher: "future",
    });
  });

  it("follows Anthropic cursor pagination and maps capabilities", async () => {
    const requests: string[] = [];
    const models = await discoverModels({
      provider: "anthropic",
      apiKey: "anthropic-secret",
      fetcher: (input, init) => {
        requests.push(requestUrl(input));
        const headers = new Headers(init?.headers);
        expect(headers.get("x-api-key")).toBe("anthropic-secret");
        expect(headers.get("anthropic-version")).toBe("2023-06-01");
        return Promise.resolve(
          requests.length === 1
            ? jsonResponse({
                data: [
                  {
                    id: "claude-new",
                    type: "model",
                    display_name: "Claude New",
                    created_at: "2030-01-01T00:00:00Z",
                    max_input_tokens: 200_000,
                    capabilities: {
                      image_input: { supported: true },
                      structured_outputs: { supported: true },
                      tool_use: { supported: true },
                      thinking: { supported: true },
                    },
                  },
                ],
                has_more: true,
                last_id: "claude-new",
              })
            : jsonResponse({
                data: [{ id: "claude-second", type: "model", display_name: "Claude Second" }],
                has_more: false,
                last_id: "claude-second",
              }),
        );
      },
    });

    expect(requests).toHaveLength(2);
    expect(requests[1]).toContain("after_id=claude-new");
    expect(models).toHaveLength(2);
    expect(models[0]).toMatchObject({
      displayName: "Claude New",
      contextWindow: 200_000,
      capabilities: {
        text: true,
        vision: true,
        tools: true,
        structuredOutput: true,
        reasoning: true,
      },
    });
  });

  it("follows Gemini page tokens and keeps generateContent models", async () => {
    const requests: string[] = [];
    const models = await discoverModels({
      provider: "gemini",
      apiKey: "gemini-secret",
      fetcher: (input, init) => {
        requests.push(requestUrl(input));
        expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("gemini-secret");
        return Promise.resolve(
          requests.length === 1
            ? jsonResponse({
                models: [
                  {
                    name: "models/gemini-new-001",
                    baseModelId: "gemini-new",
                    displayName: "Gemini New",
                    inputTokenLimit: 32_000,
                    supportedGenerationMethods: ["generateContent"],
                  },
                  {
                    name: "models/gemini-embedding",
                    baseModelId: "gemini-embedding",
                    supportedGenerationMethods: ["embedContent"],
                  },
                ],
                nextPageToken: "next-page",
              })
            : jsonResponse({
                models: [
                  { name: "models/gemini-second", supportedGenerationMethods: ["generateContent"] },
                ],
              }),
        );
      },
    });

    expect(requests).toHaveLength(2);
    expect(requests[1]).toContain("pageToken=next-page");
    expect(models.map((model) => model.id)).toEqual(["gemini-new", "gemini-second"]);
    expect(models[0]).toMatchObject({ contextWindow: 32_000, capabilities: { text: true } });
  });

  it("normalizes OpenRouter metadata and filters non-text output", async () => {
    const models = await discoverModels({
      provider: "openrouter",
      apiKey: "router-secret",
      fetcher: (input, init) => {
        expect(requestUrl(input)).toContain("output_modalities=text");
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer router-secret");
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "future/vision-model",
                name: "Future Vision",
                context_length: 128_000,
                created: 1_800_000_000,
                architecture: { input_modalities: ["text", "image"], output_modalities: ["text"] },
                supported_parameters: ["tools", "response_format"],
                pricing: { prompt: "0.000001", completion: "0.000002" },
              },
              {
                id: "future/image-model",
                name: "Future Image",
                architecture: { input_modalities: ["text"], output_modalities: ["image"] },
              },
            ],
          }),
        );
      },
    });

    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      id: "future/vision-model",
      publisher: "future",
      contextWindow: 128_000,
      capabilities: { text: true, vision: true, tools: true, structuredOutput: true },
      pricing: { input: 0.000001, output: 0.000002, currency: "USD", unit: "USD/token" },
    });
  });

  it("uses the conventional custom /models endpoint and accepts an array", async () => {
    const models = await discoverModels({
      provider: "openai-compatible",
      apiKey: "custom-secret",
      baseUrl: "https://localhost.example/v1/",
      fetcher: (input, init) => {
        expect(requestUrl(input)).toBe("https://localhost.example/v1/models");
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer custom-secret");
        return Promise.resolve(jsonResponse([{ id: "my-private-model" }]));
      },
    });

    expect(models).toMatchObject([
      { id: "my-private-model", provider: "openai-compatible", source: "provider" },
    ]);
  });

  it("normalizes discovery failures without leaking credentials", async () => {
    const failureCases = [
      { status: 401, code: "AI_INVALID_CREDENTIALS" },
      { status: 404, code: "AI_MODEL_DISCOVERY_UNAVAILABLE" },
      { status: 429, code: "AI_RATE_LIMITED" },
      { status: 500, code: "AI_PROVIDER_UNAVAILABLE" },
    ] as const;
    for (const failureCase of failureCases) {
      let failure: unknown;
      try {
        await discoverModels({
          provider: "openai",
          apiKey: "secret-not-for-logs",
          fetcher: () =>
            Promise.resolve(new Response("provider error", { status: failureCase.status })),
        });
      } catch (error) {
        failure = error;
      }
      expect(failure).toMatchObject({ code: failureCase.code });
      expect(String(failure)).not.toContain("secret-not-for-logs");
    }

    let malformed: unknown;
    try {
      await discoverModels({
        provider: "openai",
        apiKey: "secret",
        fetcher: () => Promise.resolve(jsonResponse({ unexpected: true })),
      });
    } catch (error) {
      malformed = error;
    }
    expect(malformed).toMatchObject({ code: "AI_INVALID_RESPONSE" });
  });

  it("maps provider timeouts and caller cancellation to safe errors", async () => {
    let timeoutFailure: unknown;
    try {
      await discoverModels({
        provider: "openai",
        apiKey: "secret",
        timeoutMs: 1,
        fetcher: (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
              once: true,
            });
          }),
      });
    } catch (error) {
      timeoutFailure = error;
    }
    expect(timeoutFailure).toMatchObject({ code: "AI_TIMEOUT" });

    const controller = new AbortController();
    controller.abort();
    let cancellationFailure: unknown;
    try {
      await discoverModels({
        provider: "openai",
        apiKey: "secret",
        signal: controller.signal,
        fetcher: (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
              once: true,
            });
          }),
      });
    } catch (error) {
      cancellationFailure = error;
    }
    expect(cancellationFailure).toMatchObject({ code: "AI_CANCELLED" });
  });

  it("keeps unknown and manual model IDs valid regardless of discovery", () => {
    expect(validateModelSelection("openai", "totally-new-provider-model-2030")).toBe(true);
    expect(validateModelSelection("anthropic", "private-model-alias")).toBe(true);
    expect(validateModelSelection("openrouter", "future/model:free")).toBe(true);
    expect(validateModelSelection("openai", "model\nwith-control")).toBe(false);
  });
});

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function requestUrl(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  if (input instanceof Request) return input.url;
  return input.toString();
}
