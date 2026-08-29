import { Link } from "expo-router";
import { useState } from "react";

import { Alert, Button, Field, Input, Stack } from "@boccone/ui-mobile";

import { AuthFeedback } from "../../components/AuthFeedback";
import { AuthFrame } from "../../components/AuthFrame";
import { useI18n } from "../../i18n/context";
import { authClient } from "../../lib/auth-client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { copy } = useI18n();

  async function requestReset() {
    const emailValue = email.trim();
    if (!emailValue) return setError(copy.auth.validation.emailRequired);
    if (!EMAIL_PATTERN.test(emailValue)) return setError(copy.auth.validation.emailInvalid);

    setLoading(true);
    setError(null);
    try {
      const result = await authClient.requestPasswordReset({
        email: emailValue,
        redirectTo: "boccone://reset-password",
      });
      if (result.error) {
        setError(result.error.message ?? copy.auth.errors.requestReset);
        return;
      }
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.auth.errors.requestReset);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title={copy.auth.forgotPassword.title} subtitle={copy.auth.forgotPassword.subtitle}>
      <Stack gap="md">
        <Field label={copy.auth.signIn.emailLabel} required>
          <Input
            accessibilityLabel={copy.auth.signIn.emailLabel}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder={copy.auth.signIn.emailPlaceholder}
            returnKeyType="done"
            textContentType="username"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => void requestReset()}
          />
        </Field>
        <AuthFeedback message={error} />
        {sent ? (
          <Alert tone="success" message={copy.auth.forgotPassword.success} />
        ) : (
          <Button fullWidth size="lg" loading={loading} onPress={() => void requestReset()}>
            {copy.auth.forgotPassword.submit}
          </Button>
        )}
      </Stack>
      <Link href="/(auth)/sign-in" asChild>
        <Button fullWidth variant="ghost">
          {copy.auth.forgotPassword.backToSignIn}
        </Button>
      </Link>
    </AuthFrame>
  );
}
