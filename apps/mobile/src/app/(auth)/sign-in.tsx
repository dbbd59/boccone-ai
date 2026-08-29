import { Link, router } from "expo-router";
import { StyleSheet } from "react-native";
import { useState } from "react";

import {
  Button,
  Divider,
  Field,
  Inline,
  Input,
  PasswordInput,
  Stack,
  Text,
} from "@boccone/ui-mobile";

import { AuthFeedback } from "../../components/AuthFeedback";
import { AuthFrame } from "../../components/AuthFrame";
import { useI18n } from "../../i18n/context";
import { authClient } from "../../lib/auth-client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { copy } = useI18n();

  async function signInWithEmail() {
    const emailValue = email.trim();
    if (!emailValue) return setError(copy.auth.validation.emailRequired);
    if (!EMAIL_PATTERN.test(emailValue)) return setError(copy.auth.validation.emailInvalid);
    if (!password) return setError(copy.auth.validation.passwordRequired);
    if (password.length < 8) return setError(copy.auth.validation.passwordLength);

    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({ email: emailValue, password });
      if (result.error) {
        setError(result.error.message ?? copy.auth.errors.signIn);
        return;
      }
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.auth.errors.signIn);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithSocial(provider: "google" | "apple") {
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.social({ provider, callbackURL: "/(app)" });
      if (result.error) {
        setError(
          result.error.message ??
            copy.auth.errors.social(provider === "google" ? "Google" : "Apple"),
        );
        return;
      }
      router.replace("/");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : copy.auth.errors.social(provider === "google" ? "Google" : "Apple"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title={copy.auth.signIn.title} subtitle={copy.auth.signIn.subtitle}>
      <Stack gap="md">
        <Field label={copy.auth.signIn.emailLabel} required>
          <Input
            accessibilityLabel={copy.auth.signIn.emailLabel}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder={copy.auth.signIn.emailPlaceholder}
            returnKeyType="next"
            textContentType="username"
            value={email}
            onChangeText={setEmail}
          />
        </Field>
        <Field label={copy.auth.signIn.passwordLabel} required>
          <PasswordInput
            accessibilityLabel={copy.auth.signIn.passwordLabel}
            autoComplete="current-password"
            hideLabel={copy.auth.signIn.hidePassword}
            placeholder={copy.auth.signIn.passwordPlaceholder}
            returnKeyType="done"
            showLabel={copy.auth.signIn.showPassword}
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => void signInWithEmail()}
          />
        </Field>
        <AuthFeedback message={error} />
        <Button fullWidth loading={loading} onPress={() => void signInWithEmail()}>
          {copy.auth.signIn.submit}
        </Button>
        <Link href="/(auth)/forgot-password" asChild>
          <Button fullWidth size="sm" variant="ghost">
            {copy.auth.signIn.forgotPassword}
          </Button>
        </Link>
        <Inline align="center" gap="sm">
          <Divider style={styles.divider} />
          <Text variant="caption" tone="secondary">
            {copy.auth.signIn.socialDivider}
          </Text>
          <Divider style={styles.divider} />
        </Inline>
        <Button
          fullWidth
          variant="secondary"
          disabled={loading}
          onPress={() => void signInWithSocial("google")}
        >
          {copy.auth.signIn.google}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          disabled={loading}
          onPress={() => void signInWithSocial("apple")}
        >
          {copy.auth.signIn.apple}
        </Button>
      </Stack>
      <Text variant="bodySm" tone="secondary" style={styles.footerText}>
        {copy.auth.signIn.noAccount}
      </Text>
      <Link href="/(auth)/sign-up" asChild>
        <Button fullWidth variant="ghost">
          {copy.auth.signIn.createAccount}
        </Button>
      </Link>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  divider: {
    flex: 1,
  },
  footerText: {
    textAlign: "center",
  },
});
