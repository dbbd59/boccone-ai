import { useEffect, useState } from "react";

import type { AdminUser, DailyTargets } from "@boccone/api-client";
import { Alert, Surface, Text } from "@boccone/ui-web";

import { AdminDailyTargetsPanel } from "../../components/AdminDailyTargetsPanel";
import { fetchAdminUserDailyTargets } from "../../lib/admin-api";

export function UserNutritionPage({ user }: { user: AdminUser }) {
  const [targets, setTargets] = useState<DailyTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetchAdminUserDailyTargets(user.id)
      .then((nextTargets) => {
        if (mounted) setTargets(nextTargets);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load targets");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user.id]);

  return (
    <div className="admin-section-stack">
      <div className="admin-route-intro">
        <Text as="h3" variant="headingMd">
          Nutrition
        </Text>
        <Text tone="secondary">The current backend exposes daily targets for this account.</Text>
      </div>
      {error ? <Alert tone="danger" message={error} /> : null}
      <Surface>
        <AdminDailyTargetsPanel
          loading={loading}
          targets={targets}
          userId={user.id}
          onChanged={setTargets}
        />
      </Surface>
      <Surface>
        <Text as="h3" variant="headingMd">
          Aggregate nutrition
        </Text>
        <Text tone="secondary">
          Cross-user trends and historical comparisons are not exposed by the current API yet. No
          estimates or placeholder charts are shown here.
        </Text>
      </Surface>
    </div>
  );
}
