import { useState } from "react";

import type { AdminUser } from "@boccone/api-client";
import { Button, Field, Input, Stack, Surface, Text } from "@boccone/ui-web";

import { createUser } from "../lib/admin-api";

export function CreateUserForm({ onCreated }: { onCreated: (user: AdminUser) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const user = await createUser({ name: name.trim(), email: email.trim(), password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      onCreated(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Surface>
      <Stack>
        <div>
          <Text as="h2">Create user</Text>
          <Text variant="bodySm" tone="secondary">
            Create an email/password account from operations.
          </Text>
        </div>
        <form
          className="admin-form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Field fieldId="create-name" label="Name" required>
            <Input
              id="create-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field fieldId="create-email" label="Email" required>
            <Input
              id="create-email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field fieldId="create-password" label="Temporary password" required>
            <Input
              id="create-password"
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field fieldId="create-role" label="Role" required>
            <select
              id="create-role"
              value={role}
              onChange={(event) => setRole(event.target.value as "user" | "admin")}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          {error ? (
            <Text className="admin-error" role="alert">
              {error}
            </Text>
          ) : null}
          <Button fullWidth type="submit" loading={loading}>
            Create user
          </Button>
        </form>
      </Stack>
    </Surface>
  );
}
