import { Link, router } from "expo-router";
import { useState } from "react";

import { Button, Input, Screen, Stack, Surface, Text } from "@boccone/ui-mobile";

import { AuthFeedback } from "../../components/AuthFeedback";
import { LanguageSelector } from "../../components/LanguageSelector";
import { useI18n } from "../../i18n/context";
import { authClient } from "../../lib/auth-client";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { copy } = useI18n();

  async function signUp() {
    setLoading(true);
    setError(null);
    const result = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? copy.auth.errors.signUp);
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
          <Text variant="title">{copy.auth.signUp.title}</Text>
          <Text tone="secondary">{copy.auth.signUp.subtitle}</Text>
        </Stack>
        <Surface>
          <Stack gap="md">
            <Stack gap="xs">
              <Text variant="label">{copy.auth.signUp.nameLabel}</Text>
              <Input
                accessibilityLabel={copy.auth.signUp.nameLabel}
                autoComplete="name"
                placeholder={copy.auth.signUp.namePlaceholder}
                value={name}
                onChangeText={setName}
              />
            </Stack>
            <Stack gap="xs">
              <Text variant="label">{copy.auth.signUp.emailLabel}</Text>
              <Input
                accessibilityLabel={copy.auth.signUp.emailLabel}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder={copy.auth.signUp.emailPlaceholder}
                value={email}
                onChangeText={setEmail}
              />
            </Stack>
            <Stack gap="xs">
              <Text variant="label">{copy.auth.signUp.passwordLabel}</Text>
              <Input
                accessibilityLabel={copy.auth.signUp.passwordLabel}
                autoComplete="new-password"
                placeholder={copy.auth.signUp.passwordPlaceholder}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </Stack>
            <AuthFeedback message={error} />
            <Button loading={loading} onPress={() => void signUp()}>
              {copy.auth.signUp.submit}
            </Button>
          </Stack>
        </Surface>
        <Text tone="secondary">
          {copy.auth.signUp.haveAccount}{" "}
          <Link href="/(auth)/sign-in" asChild>
            <Text tone="accent" variant="label">
              {copy.auth.signUp.signIn}
            </Text>
          </Link>
        </Text>
      </Stack>
    </Screen>
  );
}
