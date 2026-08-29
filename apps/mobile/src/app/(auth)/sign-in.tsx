import { Link, router } from "expo-router";
import { useState } from "react";

import { colors } from "@boccone/design-tokens";
import { Button, Input, Screen, Stack, Surface, Text } from "@boccone/ui-mobile";

import { AuthFeedback } from "../../components/AuthFeedback";
import { LanguageSelector } from "../../components/LanguageSelector";
import { useI18n } from "../../i18n/context";
import { authClient } from "../../lib/auth-client";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { copy } = useI18n();

  async function signInWithEmail() {
    setLoading(true);
    setError(null);
    const result = await authClient.signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? copy.auth.errors.signIn);
      return;
    }
    router.replace("/");
  }

  async function signInWithSocial(provider: "google" | "apple") {
    setLoading(true);
    setError(null);
    const result = await authClient.signIn.social({ provider, callbackURL: "/(app)" });
    setLoading(false);
    if (result.error) {
      setError(
        result.error.message ?? copy.auth.errors.social(provider === "google" ? "Google" : "Apple"),
      );
      return;
    }
    router.replace("/");
  }

  return (
    <Screen>
      <LanguageSelector />
      <Stack gap="xl" style={{ flex: 1, justifyContent: "center" }}>
        <Stack gap="sm">
          <Text variant="display">Boccone AI</Text>
          <Text variant="title">{copy.auth.signIn.title}</Text>
          <Text tone="secondary">{copy.auth.signIn.subtitle}</Text>
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
            <Stack gap="xs">
              <Text variant="label">{copy.auth.signIn.passwordLabel}</Text>
              <Input
                accessibilityLabel={copy.auth.signIn.passwordLabel}
                autoComplete="password"
                placeholder={copy.auth.signIn.passwordPlaceholder}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </Stack>
            <AuthFeedback message={error} />
            <Button loading={loading} onPress={() => void signInWithEmail()}>
              {copy.auth.signIn.submit}
            </Button>
            <Button disabled={loading} onPress={() => void signInWithSocial("google")}>
              {copy.auth.signIn.google}
            </Button>
            <Button
              disabled={loading}
              onPress={() => void signInWithSocial("apple")}
              style={{ backgroundColor: colors.text.primary }}
            >
              {copy.auth.signIn.apple}
            </Button>
            <Link href="/(auth)/forgot-password" asChild>
              <Text tone="accent" variant="label">
                {copy.auth.signIn.forgotPassword}
              </Text>
            </Link>
          </Stack>
        </Surface>
        <Text tone="secondary">
          {copy.auth.signIn.noAccount}{" "}
          <Link href="/(auth)/sign-up" asChild>
            <Text tone="accent" variant="label">
              {copy.auth.signIn.createAccount}
            </Text>
          </Link>
        </Text>
      </Stack>
    </Screen>
  );
}
