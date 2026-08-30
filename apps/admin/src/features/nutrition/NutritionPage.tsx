import { ComingSoon, Text } from "@boccone/ui-web";

import { useAdminRouter } from "../../lib/navigation-context";

export function NutritionPage() {
  const { navigate } = useAdminRouter();

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <Text as="h2" variant="headingLg">
          Nutrition
        </Text>
        <Text tone="secondary">
          A home for product-wide nutrition insights as that API surface grows.
        </Text>
      </div>
      <ComingSoon
        title="Aggregate nutrition is not available yet"
        message="The current admin API exposes daily targets inside each user workspace. Cross-user trends, averages, and period comparisons are not available, so this page does not show placeholder metrics."
        actionLabel="Open users"
        onAction={() => navigate("/users")}
      />
    </div>
  );
}
