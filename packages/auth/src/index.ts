import { createAuth } from "./create-auth";

export { createAuth } from "./create-auth";
export type {
  AppleOAuthConfig,
  CreateAuthOptions,
  GoogleOAuthConfig,
  SendResetPasswordEmail,
  SendResetPasswordEmailInput,
} from "./types";

/** The fully configured Better Auth instance type used across the API. */
export type BocconeAuth = ReturnType<typeof createAuth>;
export type BocconeSession = NonNullable<
  Awaited<ReturnType<BocconeAuth["api"]["getSession"]>>
>;
