import { Link, router } from "expo-router";
import { useState } from "react";

import { Button, Field, Input, PasswordInput, Stack, Text } from "@boccone/ui-mobile";

import { AuthFeedback } from "../../components/AuthFeedback";
import { AuthFrame } from "../../components/AuthFrame";
import { useI18n } from "../../i18n/context";
import { authClient } from "../../lib/auth-client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { copy } = useI18n();

  async function signUp() {
    const nameValue = name.trim();
    const emailValue = email.trim();
    if (!nameValue) return setError(copy.auth.validation.nameRequired);
    if (!emailValue) return setError(copy.auth.validation.emailRequired);
    if (!EMAIL_PATTERN.test(emailValue)) return setError(copy.auth.validation.emailInvalid);
    if (!password) return setError(copy.auth.validation.passwordRequired);
    if (password.length < 8) return setError(copy.auth.validation.passwordLength);

    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signUp.email({
        name: nameValue,
        email: emailValue,
        password,
      });
      if (result.error) {
        setError(result.error.message ?? copy.auth.errors.signUp);
        return;
      }
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.auth.errors.signUp);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title={copy.auth.signUp.title} subtitle={copy.auth.signUp.subtitle}>
      <Stack gap="md">
        <Field label={copy.auth.signUp.nameLabel} required>
          <Input
            accessibilityLabel={copy.auth.signUp.nameLabel}
            autoComplete="name"
            placeholder={copy.auth.signUp.namePlaceholder}
            returnKeyType="next"
            textContentType="name"
            value={name}
            onChangeText={setName}
          />
        </Field>
        <Field label={copy.auth.signUp.emailLabel} required>
          <Input
            accessibilityLabel={copy.auth.signUp.emailLabel}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder={copy.auth.signUp.emailPlaceholder}
            returnKeyType="next"
            textContentType="username"
            value={email}
            onChangeText={setEmail}
          />
        </Field>
        <Field label={copy.auth.signUp.passwordLabel} required>
          <PasswordInput
            accessibilityLabel={copy.auth.signUp.passwordLabel}
            autoComplete="new-password"
            hideLabel={copy.auth.signUp.hidePassword}
            placeholder={copy.auth.signUp.passwordPlaceholder}
            returnKeyType="done"
            showLabel={copy.auth.signUp.showPassword}
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => void signUp()}
          />
        </Field>
        <AuthFeedback message={error} />
        <Button fullWidth size="lg" loading={loading} onPress={() => void signUp()}>
          {copy.auth.signUp.submit}
        </Button>
      </Stack>
      <Text variant="bodySm" tone="secondary" style={{ textAlign: "center" }}>
        {copy.auth.signUp.haveAccount}
      </Text>
      <Link href="/(auth)/sign-in" asChild>
        <Button fullWidth variant="ghost">
          {copy.auth.signUp.signIn}
        </Button>
      </Link>
    </AuthFrame>
  );
}
