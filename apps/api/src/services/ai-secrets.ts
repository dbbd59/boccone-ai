import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { AiError } from "@boccone/ai";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

export interface SecretBox {
  encrypt(value: string): string;
  decrypt(value: string): string;
}

/** AES-256-GCM envelope. The process key is supplied only through the environment. */
export function createSecretBox(encodedKey?: string): SecretBox {
  const key = parseKey(encodedKey);
  return {
    encrypt(value) {
      if (!key) throw new AiError("AI_SECRET_UNAVAILABLE");
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();
      return [
        "v1",
        iv.toString("base64url"),
        tag.toString("base64url"),
        ciphertext.toString("base64url"),
      ].join(".");
    },
    decrypt(envelope) {
      if (!key) throw new AiError("AI_SECRET_UNAVAILABLE");
      try {
        const [version, ivText, tagText, ciphertextText] = envelope.split(".");
        if (version !== "v1" || !ivText || !tagText || !ciphertextText)
          throw new Error("Malformed secret");
        const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivText, "base64url"));
        decipher.setAuthTag(Buffer.from(tagText, "base64url"));
        return Buffer.concat([
          decipher.update(Buffer.from(ciphertextText, "base64url")),
          decipher.final(),
        ]).toString("utf8");
      } catch {
        throw new AiError("AI_SECRET_UNAVAILABLE");
      }
    },
  };
}

function parseKey(encodedKey?: string): Buffer | null {
  if (!encodedKey) return null;
  const trimmed = encodedKey.trim();
  const key = /^[0-9a-f]{64}$/i.test(trimmed)
    ? Buffer.from(trimmed, "hex")
    : isCanonicalBase64(trimmed)
      ? Buffer.from(trimmed, "base64")
      : Buffer.alloc(0);
  if (key.length !== KEY_BYTES) {
    throw new AiError("AI_SECRET_UNAVAILABLE");
  }
  return key;
}

function isCanonicalBase64(value: string): boolean {
  if (!value || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  return Buffer.from(value, "base64").toString("base64") === value;
}
