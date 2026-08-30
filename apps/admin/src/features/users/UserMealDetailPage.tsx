import { useEffect, useState } from "react";

import type { AdminUser, Meal } from "@boccone/api-client";
import { Alert, Button, Surface, Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
import { fetchAdminUserMeal, removeAdminMeal } from "../../lib/admin-api";
import { useAdminRouter } from "../../lib/navigation-context";
import { userPath } from "../../lib/navigation";
import { MealEntries } from "./MealEntries";
import { MealForm } from "./MealForm";

export function UserMealDetailPage({ user, mealId }: { user: AdminUser; mealId: string }) {
  const { navigate } = useAdminRouter();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let mounted = true;
    void fetchAdminUserMeal(user.id, mealId)
      .then((nextMeal) => {
        if (mounted) setMeal(nextMeal);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load meal");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [mealId, user.id]);

  if (loading)
    return (
      <div className="admin-route-state">
        <Text role="status" tone="secondary">
          Loading meal details…
        </Text>
      </div>
    );
  if (!meal) {
    return (
      <div className="admin-route-state">
        <Text as="h3" variant="headingLg">
          Meal not found
        </Text>
        <Text tone="secondary">{error ?? "This meal is unavailable for this user."}</Text>
        <AdminLink className="admin-text-link" to={userPath(user.id, "meals")}>
          Back to meals
        </AdminLink>
      </div>
    );
  }

  const currentMeal = meal;

  async function remove() {
    if (!window.confirm(`Remove ${currentMeal.name}? This cannot be undone.`)) return;
    setRemoving(true);
    setError(null);
    try {
      await removeAdminMeal(user.id, currentMeal.id);
      navigate(userPath(user.id, "meals"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove meal");
      setRemoving(false);
    }
  }

  return (
    <div className="admin-section-stack">
      <div className="admin-route-intro admin-route-intro-row">
        <div>
          <Text as="h3" variant="headingMd">
            {currentMeal.name}
          </Text>
          <Text tone="secondary">Meal details for {user.name}.</Text>
        </div>
        <Button
          disabled={removing}
          type="button"
          variant="destructive"
          onClick={() => void remove()}
        >
          Delete meal
        </Button>
      </div>
      {error ? <Alert tone="danger" message={error} /> : null}
      <Surface>
        <dl className="admin-definition-grid">
          <div>
            <dt>Category</dt>
            <dd>{currentMeal.category}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{currentMeal.date}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{currentMeal.source}</dd>
          </div>
          <div>
            <dt>Calories</dt>
            <dd>{currentMeal.calories} kcal</dd>
          </div>
          <div>
            <dt>Protein</dt>
            <dd>{currentMeal.proteinGrams} g</dd>
          </div>
          <div>
            <dt>Carbohydrates</dt>
            <dd>{currentMeal.carbohydratesGrams} g</dd>
          </div>
          <div>
            <dt>Fat</dt>
            <dd>{currentMeal.fatGrams} g</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{new Date(currentMeal.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{new Date(currentMeal.updatedAt).toLocaleString()}</dd>
          </div>
          {currentMeal.notes ? (
            <div className="admin-definition-wide">
              <dt>Notes</dt>
              <dd>{currentMeal.notes}</dd>
            </div>
          ) : null}
        </dl>
      </Surface>
      <Surface>
        <MealForm key={currentMeal.id} meal={currentMeal} userId={user.id} onSaved={setMeal} />
      </Surface>
      <MealEntries entries={currentMeal.entries} />
    </div>
  );
}
