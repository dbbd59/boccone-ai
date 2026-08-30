# Boccone AI

The AI vertical keeps the existing TanStack AI harness and adds a provider
model-discovery boundary. The mobile app never calls a provider directly:

```text
Mobile AI Settings
        |
        v
Authenticated Boccone API
        |
        v
@boccone/ai discovery adapter
        |
        v
Configured provider models endpoint
```

## Boundaries

- `packages/ai` owns TanStack AI adapters, provider metadata, model discovery,
  normalized descriptors, filtering, structured output, catalog tool
  definitions, prompts, safe provider errors, timeout/cancellation handling,
  usage callbacks, and deterministic test seams.
- `apps/api` owns authenticated user configuration, AES-256-GCM encryption,
  model-discovery caching, catalog resolution, deterministic nutrition
  calculation, rate limiting, and the public contracts.
- `apps/mobile` owns the localized AI Settings experience: provider setup,
  contextual API-key guides, searchable model selection, refresh/error/empty
  states, and manual model IDs. It does not receive stored secrets.

The existing meal composer remains the only confirmation/save surface for AI
meal drafts. Interpretation never creates a meal automatically.

## Provider metadata

The central registry is `packages/ai/src/registry.ts`. Each provider registers:

- provider id and human label;
- whether a base URL is required;
- whether model discovery is supported;
- a small `recommendedModels` list used only for ranking and onboarding;
- official documentation and API-key URLs;
- a guide key used by the mobile English/Italian translations.

The recommendation list is not an allowlist. A model returned by a provider,
or entered manually by the user, is valid when its model ID has valid syntax.
This keeps new releases, aliases, private deployments, and provider-listing
gaps usable without a Boccone deployment.

## Model discovery

`discoverModels({ provider, apiKey, baseUrl?, signal? })` lives in
`packages/ai/src/model-discovery.ts`. Adapters own provider-specific request
headers, pagination, parsing, and normalization.

| Provider          | Endpoint and authentication                                                               | Provider-specific handling                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI            | `GET https://api.openai.com/v1/models`, `Authorization: Bearer`                           | Normalizes `id`, `owned_by`, creation time, and future shutdown metadata.                                                                               |
| Anthropic         | `GET https://api.anthropic.com/v1/models`, `x-api-key`, `anthropic-version: 2023-06-01`   | Follows `has_more` with `after_id`; maps capabilities, display name, creation time, and input context.                                                  |
| Gemini            | `GET https://generativelanguage.googleapis.com/v1beta/models`, `x-goog-api-key`           | Follows `nextPageToken`; keeps models supporting `generateContent`, using `baseModelId` for inference.                                                  |
| OpenRouter        | `GET https://openrouter.ai/api/v1/models?output_modalities=text`, `Authorization: Bearer` | Keeps text-output models, normalizes modalities, context, publisher, capabilities, and provider-reported pricing metadata.                              |
| OpenAI-compatible | `GET <baseUrl>/models`, `Authorization: Bearer`                                           | Accepts the conventional `data` response or a top-level array. Unsupported endpoints or shapes become a discovery failure, never a configuration block. |

The implementation uses the official provider APIs documented at [OpenAI list
models](https://developers.openai.com/api/reference/resources/models/methods/list),
[Anthropic list models](https://docs.anthropic.com/en/api/models-list), [Gemini
models](https://ai.google.dev/api/models), and [OpenRouter list
models](https://openrouter.ai/docs/api/api-reference/models/get-models).

The normalized `AiModelDescriptor` is intentionally sparse:

```ts
type AiModelDescriptor = {
  id: string;
  displayName: string;
  provider: AiProvider;
  description?: string;
  contextWindow?: number;
  capabilities?: {
    text?: boolean;
    vision?: boolean;
    tools?: boolean;
    structuredOutput?: boolean;
    reasoning?: boolean;
  };
  inputModalities?: string[];
  outputModalities?: string[];
  pricing?: { input?: number; output?: number; currency?: string; unit?: string };
  createdAt?: string;
  publisher?: string;
  source: "provider" | "manual";
};
```

Unknown upstream values remain absent. The adapter filters only resources that
are clearly unsuitable for the current text workload, such as embeddings,
moderation, speech-only, expired, or image-output-only resources. The manual
fallback remains available if filtering is too conservative or provider
metadata is incomplete.

## API and lifecycle

The authenticated endpoint is:

```text
GET /api/me/ai/models?refresh=true
```

It loads the user's configured provider, decrypts the stored key on the API
server, calls the adapter, and returns `AiModelsResponse`:

```ts
{
  provider,
  models,
  stale,
  cachedAt,
}
```

The key is never returned to Mobile, included in the response, or put in the
model cache. A successful provider/key save invalidates the user's cache. A
base URL or provider change also invalidates it. The in-process cache has a
one-hour TTL and supports explicit refresh. If a refresh fails after a prior
catalog exists, the API returns the normalized cached descriptors with
`stale: true`; invalid credentials are still surfaced as an error.

On first setup the API can store a provider key before a model is selected. The
mobile flow then loads the catalog, lets the user choose a model, and persists
the actual provider model ID. A missing model is rejected only when a harness
feature or connection test is invoked.

Meal interpretation uses a 20-second provider timeout by default. OpenRouter's
free router and `:free` model variants use a 60-second timeout because free
providers can have higher latency; timeout failures are returned as
`ai_timeout` rather than an internal server error.

OpenRouter meal interpretation uses JSON-object, non-streaming extraction. The
API performs the final schema validation locally. The authoritative
food-catalog matching remains local in the API after semantic extraction, so
the OpenRouter agent loop and native structured stream cannot stall the
request. A transient provider response that does not satisfy the schema is
retried once and otherwise returned as `ai_invalid_response`. For meal
interpretation, fenced JSON and the known legacy portion shape are repaired
before final schema validation when OpenRouter returns them.

Each extracted food may include `estimatedNutrition` for the complete described
portion: calories, protein, carbohydrates, and fat. Catalog nutrition overrides
the estimate when a unique food match and usable portion are available. For an
unknown or ambiguous food, the estimate remains visible in the review draft and
can prefill the private-food proposal; it is never treated as authoritative or
saved without user confirmation.

The update request may omit `model` when completing provider setup. Once a
model is selected, the same endpoint persists it without sending the API key
again. A manually entered ID follows the same path and is not checked against
provider list membership.

## Mobile UX

AI Settings follows this sequence:

1. Choose a provider.
2. Open the provider-specific “How do I get an API key?” guide when needed.
3. Paste the key; for custom providers also enter the base URL.
4. Save the provider/key. Discovery starts through the API.
5. Search a selector with `Recommended` and `All available models` sections.
6. Select a model or use `Can't find your model? / Enter model ID manually`.
7. Save the selected ID and use `Test connection`.

Discovery is local to the model section, so the rest of Settings remains
usable while the provider endpoint is loading. Empty, error, stale, and
manual-fallback states always provide a next action. If a selected model is no
longer in a provider response, it remains persisted and is marked as not
currently listed; it is not silently reset.

Guide copy is localized in `apps/mobile/src/i18n/translations.ts`, while URLs
and provider identity come from the central registry. Guides use official
destinations only:

- [OpenAI API keys](https://platform.openai.com/api-keys);
- [Claude Platform API keys](https://platform.claude.com/settings/keys);
- [Google AI Studio API keys](https://aistudio.google.com/app/apikey);
- [OpenRouter API keys](https://openrouter.ai/settings/keys).

The OpenAI guide notes that a full secret is shown only at creation time and
that ChatGPT and API billing are separate, based on the [OpenAI key safety
help](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key)
and [billing guidance](https://help.openai.com/en/articles/9039756). Gemini's
guide mentions project selection and possible billing requirements, based on
[Google's getting started guide](https://ai.google.dev/gemini-api/docs/get-started).

## Errors

Provider errors are normalized before leaving `packages/ai`. Current stable
codes include:

- `AI_INVALID_CREDENTIALS`;
- `AI_MODEL_NOT_FOUND`;
- `AI_MODEL_NOT_ACCESSIBLE`;
- `AI_MODEL_NOT_SELECTED`;
- `AI_MODEL_DISCOVERY_UNAVAILABLE`;
- `AI_PROVIDER_UNAVAILABLE`;
- `AI_RATE_LIMITED`;
- `AI_TIMEOUT`;
- `AI_INVALID_RESPONSE`.

The API maps them to `ai_*` contract codes. Mobile maps codes to localized
recovery copy; it does not display provider exception text. A custom provider
that has no `/models`, returns malformed JSON, times out, or rejects discovery
remains usable through manual model entry.

## Adding a provider

1. Add the provider id to `packages/contracts/src/ai.ts` and
   `packages/ai/src/registry.ts`.
2. Register human label, discovery support, recommended models (if useful),
   official links, and a unique guide key.
3. Add a provider branch and normalizer in
   `packages/ai/src/model-discovery.ts`.
4. Add exactly one inference adapter branch in `createTextAdapter` in
   `packages/ai/src/harness.ts`.
5. Add the guide copy for English and Italian in the typed mobile translations.
6. Add adapter, failure, settings, and mobile behavior tests.
7. Update `packages/api-client/openapi.yaml`, then run `bun run generate`.

The provider registry test should fail if a new provider is missing guide or
discovery metadata. Do not add a static list of every provider model to code or
documentation.

## Privacy and security

- `AI_ENCRYPTION_KEY` is server-only and must be a 32-byte base64 or
  64-character hex key.
- Stored BYOK keys use AES-256-GCM with a fresh nonce and authenticated tag.
- Discovery and inference happen server-side after session authorization.
- Keys are never placed in prompts, tool arguments, usage rows, logs, API
  responses, Sentry payloads, or cached model descriptors.
- The usage ledger stores only user, feature, provider, model, token counts,
  latency, status, safe error code, provider request id, and timestamp. It does
  not store prompts, responses, or catalog tool payloads.
- The admin usage surface exposes operational metadata only; it is never a key
  or secret-management surface.

## Tests

Default tests never make paid provider calls. Focused checks include:

```bash
bun test packages/ai
bun test apps/api/test/ai-secrets.test.ts
bun test apps/api/test/ai.integration.test.ts
```

Discovery tests use injected fetchers to verify provider headers, pagination,
normalization, filtering, malformed responses, timeouts, rate limits, empty
catalogs, newly released IDs, custom `/models`, and manual model persistence.
