import type { SendResetPasswordEmail } from "@boccone/auth";

import type { Logger } from "./logger";

export interface CreateEmailSenderOptions {
  isProduction: boolean;
  logger: Logger;
}

/**
 * Mail delivery seam for transactional emails.
 *
 * Development: prints the password-reset link to the console so local flows
 * are testable without an email provider. This intentionally exposes a
 * one-time token to the operator's own console and is disabled in production.
 *
 * Production: fails loudly instead of silently swallowing the send — wire a
 * real transactional email provider here (Resend, Postmark, SES, ...) when
 * enabling production sign-ups. The provider choice is deliberately left to
 * the operator; no vendor code is bundled.
 */
export function createResetPasswordEmailSender(
  options: CreateEmailSenderOptions,
): SendResetPasswordEmail {
  return ({ to, resetUrl }) => {
    if (options.isProduction) {
      throw new Error(
        "Password-reset email delivery is not configured. Implement a provider call in apps/api/src/email.ts (createResetPasswordEmailSender) before enabling production authentication.",
      );
    }
    options.logger.warn(
      "DEV ONLY password-reset link (development builds only — never enable in production)",
      {
        to,
        resetUrl,
      },
    );
  };
}
