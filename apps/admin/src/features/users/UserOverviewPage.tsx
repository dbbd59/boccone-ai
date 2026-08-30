import type { AdminUser } from "@boccone/api-client";
import { Surface, Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
import { userPath } from "../../lib/navigation";

export function UserOverviewPage({ user }: { user: AdminUser }) {
  return (
    <div className="admin-section-stack">
      <div className="admin-route-intro">
        <div>
          <Text as="h3" variant="headingMd">
            User overview
          </Text>
          <Text tone="secondary">A starting point for this account&apos;s operational data.</Text>
        </div>
      </div>
      <div className="admin-user-summary-grid">
        <SummaryLink
          to={userPath(user.id, "profile")}
          title="Profile"
          detail="Name, email, verification, and registration metadata."
        />
        <SummaryLink
          to={userPath(user.id, "meals")}
          title="Meals"
          detail="Inspect, create, correct, or remove confirmed meal records."
        />
        <SummaryLink
          to={userPath(user.id, "nutrition")}
          title="Nutrition"
          detail="Review and update the user's daily targets."
        />
        <SummaryLink
          to={userPath(user.id, "account")}
          title="Account"
          detail="Role, access status, and explicit account actions."
        />
      </div>
      <Surface>
        <div className="admin-section-heading">
          <div>
            <Text as="h3" variant="headingMd">
              Account snapshot
            </Text>
            <Text variant="bodySm" tone="secondary">
              Operational metadata only. Credentials and secrets are never shown.
            </Text>
          </div>
          <span className={`admin-status ${user.banned ? "is-banned" : "is-active"}`}>
            {user.banned ? "Banned" : "Active"}
          </span>
        </div>
        <dl className="admin-definition-grid">
          <div>
            <dt>Email verification</dt>
            <dd>{user.emailVerified ? "Verified" : "Not verified"}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd className="admin-table-capitalize">{user.role}</dd>
          </div>
          <div>
            <dt>Joined</dt>
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

function SummaryLink({ to, title, detail }: { to: string; title: string; detail: string }) {
  return (
    <Surface className="admin-summary-link-card">
      <AdminLink className="admin-summary-link" to={to}>
        <span>
          <strong>{title}</strong>
          <small>{detail}</small>
        </span>
        <span aria-hidden="true">→</span>
      </AdminLink>
    </Surface>
  );
}
