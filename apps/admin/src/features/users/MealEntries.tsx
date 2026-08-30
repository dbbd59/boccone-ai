import type { MealFoodEntry } from "@boccone/api-client";
import { Surface, Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
import { foodPath } from "../../lib/navigation";

export function MealEntries({ entries }: { entries: MealFoodEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <Surface>
      <div className="admin-section-heading">
        <div>
          <Text as="h3" variant="headingMd">
            Food items
          </Text>
          <Text variant="bodySm" tone="secondary">
            Confirmed items and nutrition snapshots captured when this meal was saved.
          </Text>
        </div>
      </div>
      <div className="admin-meal-entry-list">
        {entries.map((entry) => (
          <div className="admin-meal-entry-row" key={entry.id}>
            <div>
              <AdminLink className="admin-table-primary" to={foodPath(entry.foodId)}>
                {entry.foodName}
              </AdminLink>
              <Text variant="bodySm" tone="secondary">
                {entry.portionName} · {entry.grams} g · quantity {entry.quantity}
              </Text>
            </div>
            <div className="admin-meal-entry-nutrition">
              <Text variant="bodySm">{entry.energyKcal ?? "—"} kcal</Text>
              <Text variant="caption" tone="secondary">
                P {entry.proteinG ?? "—"} · C {entry.carbohydratesG ?? "—"} · F {entry.fatG ?? "—"}{" "}
                g
              </Text>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
