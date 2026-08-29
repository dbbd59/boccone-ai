import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { Alert, Button, Field, PasswordInput, Stack } from "@boccone/ui-mobile";

import { AuthFeedback } from "../../components/AuthFeedback";
import { AuthFrame } from "../../components/AuthFrame";
import { useI18n } from "../../i18n/context";
import { authClient } from "../../lib/auth-client";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { copy } = useI18n();

  async function resetPassword() {
    if (!token) {
      setError(copy.auth.errors.missingResetToken);
      return;
    }
    if (!password) {
      setError(copy.auth.validation.passwordRequired);
      return;
    }
    if (password.length < 8) {
      setError(copy.auth.validation.passwordLength);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await authClient.resetPassword({ token, newPassword: password });
      if (result.error) {
        setError(result.error.message ?? copy.auth.errors.reset);
        return;
      }
      router.replace("/(auth)/sign-in");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.auth.errors.reset);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title={copy.auth.resetPassword.title} subtitle={copy.auth.resetPassword.subtitle}>
      <Stack gap="md">
        {!token ? <Alert tone="danger" message={copy.auth.errors.missingResetToken} /> : null}
        <Field label={copy.auth.resetPassword.passwordLabel} required>
          <PasswordInput
            accessibilityLabel={copy.auth.resetPassword.passwordLabel}
            autoComplete="new-password"
            hideLabel={copy.auth.resetPassword.hidePassword}
            placeholder={copy.auth.resetPassword.passwordPlaceholder}
            returnKeyType="done"
            showLabel={copy.auth.resetPassword.showPassword}
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => void resetPassword()}
          />
        </Field>
        <AuthFeedback message={error} />
        <Button fullWidth size="lg" loading={loading} onPress={() => void resetPassword()}>
          {copy.auth.resetPassword.submit}
        </Button>
      </Stack>
    </AuthFrame>
  );
}
