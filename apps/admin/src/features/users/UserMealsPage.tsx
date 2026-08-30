import { useEffect, useState } from "react";

import type { AdminUser, Meal } from "@boccone/api-client";
import { Alert, Button, Field, Input, Surface, Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
import { fetchAdminUserMeals } from "../../lib/admin-api";
import { useAdminRouter } from "../../lib/navigation-context";
import { userMealPath, userPath } from "../../lib/navigation";
import { MealForm } from "./MealForm";

const PAGE_SIZE = 20;

const CATEGORY_LABELS: Record<Meal["category"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function UserMealsPage({ user }: { user: AdminUser }) {
  const { navigate } = useAdminRouter();
  const initialQuery = new URLSearchParams(window.location.search);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState(initialQuery.get("date") ?? "");
  const [activeDate, setActiveDate] = useState(initialQuery.get("date") ?? "");
  const [offset, setOffset] = useState(Number(initialQuery.get("page") ?? 0) * PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    // This effect synchronizes the user meal list with the remote request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void fetchAdminUserMeals(user.id, { date: activeDate || undefined, limit: PAGE_SIZE, offset })
      .then((result) => {
        if (!mounted) return;
        setMeals(result.meals);
        setTotal(result.total);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load meals");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeDate, offset, refreshToken, user.id]);

  function updateUrl(next: { date?: string; page?: number }) {
    const nextDate = next.date ?? activeDate;
    const nextPage = next.page ?? Math.floor(offset / PAGE_SIZE);
    const params = new URLSearchParams();
    if (nextDate) params.set("date", nextDate);
    if (nextPage > 0) params.set("page", String(nextPage));
    const query = params.toString();
    navigate(`${userPath(user.id, "meals")}${query ? `?${query}` : ""}`, true);
  }

  function applyDate() {
    const nextDate = date.trim();
    setActiveDate(nextDate);
    setOffset(0);
    updateUrl({ date: nextDate, page: 0 });
  }

  return (
    <div className="admin-section-stack">
      <div className="admin-route-intro admin-route-intro-row">
        <div>
          <Text as="h3" variant="headingMd">
            Meals
          </Text>
          <Text tone="secondary">Confirmed meal records owned by this user.</Text>
        </div>
        <Button type="button" onClick={() => setShowCreate((visible) => !visible)}>
          {showCreate ? "Close create form" : "New meal"}
        </Button>
      </div>
      {showCreate ? (
        <Surface>
          <MealForm
            userId={user.id}
            onSaved={() => {
              setShowCreate(false);
              setRefreshToken((value) => value + 1);
            }}
          />
        </Surface>
      ) : null}
      <Surface className="admin-resource-surface">
        <div className="admin-resource-heading">
          <div>
            <Text as="h4" variant="headingMd">
              Meal records
            </Text>
            <Text variant="bodySm" tone="secondary">
              {total} {total === 1 ? "meal" : "meals"}
            </Text>
          </div>
        </div>
        <form
          className="admin-filter-bar"
          onSubmit={(event) => {
            event.preventDefault();
            applyDate();
          }}
        >
          <Field fieldId="user-meals-date" label="Filter by date">
            <Input
              id="user-meals-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          {activeDate ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDate("");
                setActiveDate("");
                setOffset(0);
                updateUrl({ date: "", page: 0 });
              }}
            >
              Clear
            </Button>
          ) : null}
        </form>
        {error ? <Alert tone="danger" message={error} /> : null}
        {loading ? (
          <Text role="status" tone="secondary">
            Loading meals…
          </Text>
        ) : null}
        {!loading && meals.length === 0 ? (
          <div className="admin-empty-state">
            <Text variant="headingSm">No meals found</Text>
            <Text variant="bodySm" tone="secondary">
              {activeDate
                ? "Try another date or clear the filter."
                : "Create the first meal for this user."}
            </Text>
          </div>
        ) : null}
        {meals.length > 0 ? <MealTable meals={meals} userId={user.id} /> : null}
        <div className="admin-pagination">
          <Text variant="bodySm" tone="secondary">
            {total === 0
              ? "No results"
              : `Showing ${offset + 1}–${Math.min(offset + meals.length, total)} of ${total}`}
          </Text>
          <div className="admin-pagination-actions">
            <Button
              disabled={loading || offset === 0}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => {
                const next = Math.max(0, offset - PAGE_SIZE);
                setOffset(next);
                updateUrl({ page: Math.floor(next / PAGE_SIZE) });
              }}
            >
              Previous
            </Button>
            <Button
              disabled={loading || offset + PAGE_SIZE >= total}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => {
                const next = offset + PAGE_SIZE;
                setOffset(next);
                updateUrl({ page: Math.floor(next / PAGE_SIZE) });
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </Surface>
    </div>
  );
}

function MealTable({ meals, userId }: { meals: Meal[]; userId: string }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Meal</th>
            <th scope="col">Category</th>
            <th scope="col">Date</th>
            <th scope="col">Nutrition</th>
            <th scope="col">
              <span className="admin-visually-hidden">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {meals.map((meal) => (
            <tr key={meal.id}>
              <td>
                <AdminLink className="admin-table-primary" to={userMealPath(userId, meal.id)}>
                  {meal.name}
                </AdminLink>
                <span className="admin-table-secondary">{meal.source}</span>
              </td>
              <td>{CATEGORY_LABELS[meal.category]}</td>
              <td>{meal.date}</td>
              <td>
                <span className="admin-numeric">{meal.calories} kcal</span>
                <span className="admin-table-secondary">
                  P {meal.proteinGrams} · C {meal.carbohydratesGrams} · F {meal.fatGrams} g
                </span>
              </td>
              <td className="admin-table-action">
                <AdminLink className="admin-text-link" to={userMealPath(userId, meal.id)}>
                  Details
                </AdminLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
