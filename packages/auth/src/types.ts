import type { Database } from "@boccone/db";

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
};

/**
 * Apple Sign In configuration.
 * - `clientId` is the Services ID used for web-based flows.
 * - `bundleId` is the native App ID used for ID-token (native) sign-in.
 * The client secret JWT is minted at runtime from the .p8 key — never store a
 * pre-generated secret.
 */
export type AppleOAuthConfig = {
  clientId: string;
  bundleId: string;
  teamId: string;
  keyId: string;
  /** PKCS8 PEM contents of the .p8 key (\n-escaped when provided via env). */
  privateKey: string;
};

export type SendResetPasswordEmailInput = {
  to: string;
  /** Full password-reset URL including the one-time token. */
  resetUrl: string;
};

/**
 * Mail delivery seam. The API decides how mail is delivered (dev console,
 * transactional provider); the auth package stays transport-agnostic.
 */
export type SendResetPasswordEmail = (input: SendResetPasswordEmailInput) => Promise<void> | void;

export type CreateAuthOptions = {
  db: Database;
  secret: string;
  /** Public base URL of the API, e.g. https://api.example.com. */
  baseURL: string;
  /**
   * Origins allowed to drive auth flows (admin app, Expo web).
   * The native deep-link scheme and Apple's token endpoint are added here
   * automatically — do not put deep-link schemes in this list yourself.
   */
  trustedOrigins: string[];
  isProduction: boolean;
  /** Deep-link scheme of the mobile app. Defaults to `boccone`. */
  mobileScheme?: string;
  google?: GoogleOAuthConfig;
  apple?: AppleOAuthConfig;
  sendResetPasswordEmail: SendResetPasswordEmail;
};
