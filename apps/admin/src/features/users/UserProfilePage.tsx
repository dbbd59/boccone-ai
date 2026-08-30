import { useState } from "react";

import type { AdminUser } from "@boccone/api-client";
import { Alert, Button, Field, Input, Surface, Text } from "@boccone/ui-web";

import { updateUser } from "../../lib/admin-api";

export function UserProfilePage({
  user,
  onChanged,
}: {
  user: AdminUser;
  onChanged: (user: AdminUser) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateUser(user.id, { name: name.trim(), email: email.trim() });
      setName(updated.name);
      setEmail(updated.email);
      onChanged(updated);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-section-stack">
      <div className="admin-route-intro">
        <div>
          <Text as="h3" variant="headingMd">
            Profile / Anagrafica
          </Text>
          <Text tone="secondary">
            Edit only the account metadata currently supported by the API.
          </Text>
        </div>
      </div>
      <Surface>
        <form className="admin-form-grid" onSubmit={(event) => void save(event)}>
          <Field fieldId="profile-name" label="Name" required>
            <Input
              id="profile-name"
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
            />
          </Field>
          <Field fieldId="profile-email" label="Email" required>
            <Input
              id="profile-email"
              required
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSaved(false);
              }}
            />
          </Field>
          {error ? <Alert tone="danger" message={error} /> : null}
          {saved ? <Alert tone="success" message="Profile updated." /> : null}
          <Button loading={loading} type="submit">
            Save profile
          </Button>
        </form>
      </Surface>
      <Surface>
        <Text as="h3" variant="headingMd">
          Account metadata
        </Text>
        <dl className="admin-definition-grid">
          <div>
            <dt>Email verification</dt>
            <dd>{user.emailVerified ? "Verified" : "Not verified"}</dd>
          </div>
          <div>
            <dt>Registration date</dt>
            <dd>{new Date(user.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd className="admin-mono">{user.id}</dd>
          </div>
        </dl>
      </Surface>
    </div>
  );
}
