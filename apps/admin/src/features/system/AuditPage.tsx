import { Surface, Text } from "@boccone/ui-web";

import { AuditLogPanel } from "../../components/AuditLogPanel";

export function AuditPage() {
  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <Text as="h2" variant="headingLg">
          Audit log
        </Text>
        <Text tone="secondary">Trace sensitive account and application-data mutations.</Text>
      </div>
      <Surface>
        <AuditLogPanel refreshToken={0} />
      </Surface>
    </div>
  );
}
