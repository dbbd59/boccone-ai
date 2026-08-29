import { SignJWT, importPKCS8 } from "jose";

import type { AppleOAuthConfig } from "./types";

/** Apple rejects client secrets valid beyond six months; stay comfortably below. */
const CLIENT_SECRET_TTL_SECONDS = 180 * 24 * 60 * 60;

/**
 * Mint the Apple "client secret" JWT from the .p8 signing key.
 * Called lazily per provider request via Better Auth's async social provider
 * config, so keys are only touched in memory and never persisted.
 */
export async function generateAppleClientSecret(apple: AppleOAuthConfig): Promise<string> {
  const key = await importPKCS8(apple.privateKey, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: apple.keyId })
    .setIssuer(apple.teamId)
    .setSubject(apple.clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + CLIENT_SECRET_TTL_SECONDS)
    .sign(key);
}
