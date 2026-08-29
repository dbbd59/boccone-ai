import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { Button, Input, Screen, Stack, Surface, Text } from "@boccone/ui-mobile";

import { AuthFeedback } from "../../components/AuthFeedback";
import { LanguageSelector } from "../../components/LanguageSelector";
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
    setLoading(true);
    setError(null);
    const result = await authClient.resetPassword({ token, newPassword: password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? copy.auth.errors.reset);
      return;
    }
    router.replace("/(auth)/sign-in");
  }

  return (
    <Screen>
      <LanguageSelector />
      <Stack gap="xl" style={{ flex: 1, justifyContent: "center" }}>
        <Stack gap="sm">
          <Text variant="title">{copy.auth.resetPassword.title}</Text>
          <Text tone="secondary">{copy.auth.resetPassword.subtitle}</Text>
        </Stack>
        <Surface>
          <Stack gap="md">
            <Stack gap="xs">
              <Text variant="label">{copy.auth.resetPassword.passwordLabel}</Text>
              <Input
                accessibilityLabel={copy.auth.resetPassword.passwordLabel}
                autoComplete="new-password"
                placeholder={copy.auth.resetPassword.passwordPlaceholder}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </Stack>
            <AuthFeedback message={error} />
            <Button loading={loading} onPress={() => void resetPassword()}>
              {copy.auth.resetPassword.submit}
            </Button>
          </Stack>
        </Surface>
      </Stack>
    </Screen>
  );
}
