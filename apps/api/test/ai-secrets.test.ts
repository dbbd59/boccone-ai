import { describe, expect, it } from "bun:test";

import { AiError } from "@boccone/ai";

import { createSecretBox } from "../src/services/ai-secrets";

const key = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

describe("AI secret envelope", () => {
  it("encrypts with a fresh envelope and decrypts the API key", () => {
    const box = createSecretBox(key);
    const first = box.encrypt("provider-secret");
    const second = box.encrypt("provider-secret");
    expect(first).not.toBe(second);
    expect(box.decrypt(first)).toBe("provider-secret");
    expect(box.decrypt(second)).toBe("provider-secret");
    expect(first).not.toContain("provider-secret");
  });

  it("fails closed when encryption is unavailable or the envelope is invalid", () => {
    expect(() => createSecretBox().encrypt("secret")).toThrow(AiError);
    expect(() => createSecretBox(key).decrypt("not-an-envelope")).toThrow(AiError);
  });
});
