import { Link } from "expo-router";
import { useState } from "react";

import { Button, Input, Screen, Stack, Surface, Text } from "@boccone/ui-mobile";

import { AuthFeedback } from "../../components/AuthFeedback";
import { LanguageSelector } from "../../components/LanguageSelector";
import { useI18n } from "../../i18n/context";
import { authClient } from "../../lib/auth-client";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { copy } = useI18n();

  async function requestReset() {
    setLoading(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: "boccone://reset-password",
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? copy.auth.errors.requestReset);
      return;
    }
    setSent(true);
  }

  return (
    <Screen>
      <LanguageSelector />
      <Stack gap="xl" style={{ flex: 1, justifyContent: "center" }}>
        <Stack gap="sm">
          <Text variant="title">{copy.auth.forgotPassword.title}</Text>
          <Text tone="secondary">{copy.auth.forgotPassword.subtitle}</Text>
        </Stack>
        <Surface>
          <Stack gap="md">
            <Stack gap="xs">
              <Text variant="label">{copy.auth.signIn.emailLabel}</Text>
              <Input
                accessibilityLabel={copy.auth.signIn.emailLabel}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder={copy.auth.signIn.emailPlaceholder}
                value={email}
                onChangeText={setEmail}
              />
            </Stack>
            <AuthFeedback message={error} />
            {sent ? (
              <Text tone="positive">{copy.auth.forgotPassword.success}</Text>
            ) : (
              <Button loading={loading} onPress={() => void requestReset()}>
                {copy.auth.forgotPassword.submit}
              </Button>
            )}
          </Stack>
        </Surface>
        <Link href="/(auth)/sign-in" asChild>
          <Text tone="accent" variant="label">
            {copy.auth.forgotPassword.backToSignIn}
          </Text>
        </Link>
      </Stack>
    </Screen>
  );
}
