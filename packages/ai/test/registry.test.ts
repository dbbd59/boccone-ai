import { describe, expect, it } from "bun:test";

import { AI_PROVIDERS, listProviderDefinitions } from "../src";

describe("AI provider registry", () => {
  it("keeps discovery and setup metadata complete for every provider", () => {
    const definitions = listProviderDefinitions();
    expect(definitions.map((definition) => definition.id)).toEqual([...AI_PROVIDERS]);

    for (const definition of definitions) {
      expect(definition.guide.key).toBe(definition.id);
      expect(definition.supportsModelDiscovery).toBe(true);
      expect(new Set(definition.recommendedModels.map((model) => model.id)).size).toBe(
        definition.recommendedModels.length,
      );
      if (definition.id === "openai-compatible") {
        expect(definition.guide.apiKeyUrl).toBeUndefined();
      } else {
        expect(definition.guide.docsUrl).toMatch(/^https:\/\//);
        expect(definition.guide.apiKeyUrl).toMatch(/^https:\/\//);
      }
    }
  });
});
