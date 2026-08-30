import { useEffect, useState } from "react";

import type { AdminGlobalMeal, MealCategory } from "@boccone/api-client";
import { Alert, Button, Field, Input, Surface, Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
import { fetchAdminMeal, fetchAdminMeals, removeAdminMeal } from "../../lib/admin-api";
import { useAdminRouter } from "../../lib/navigation-context";
import { mealPath, userPath } from "../../lib/navigation";
import { MealEntries } from "../users/MealEntries";
import { MealForm } from "../users/MealForm";

const PAGE_SIZE = 20;
const CATEGORIES: { value: MealCategory | ""; label: string }[] = [
  { value: "", label: "All categories" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export function MealsPage() {
  const { navigate } = useAdminRouter();
  const initialQuery = new URLSearchParams(window.location.search);
  const [meals, setMeals] = useState<AdminGlobalMeal[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(initialQuery.get("q") ?? "");
  const [activeSearch, setActiveSearch] = useState(initialQuery.get("q") ?? "");
  const [date, setDate] = useState(initialQuery.get("date") ?? "");
  const [activeDate, setActiveDate] = useState(initialQuery.get("date") ?? "");
  const [category, setCategory] = useState<MealCategory | "">(
    (initialQuery.get("category") as MealCategory | "") || "",
  );
  const [activeCategory, setActiveCategory] = useState<MealCategory | "">(
    (initialQuery.get("category") as MealCategory | "") || "",
  );
  const [offset, setOffset] = useState(Number(initialQuery.get("page") ?? 0) * PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // This effect synchronizes the global meal table with the remote request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void fetchAdminMeals({
      search: activeSearch || undefined,
      date: activeDate || undefined,
      category: activeCategory || undefined,
      limit: PAGE_SIZE,
      offset,
    })
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
  }, [activeCategory, activeDate, activeSearch, offset]);

  function updateUrl(next: {
    search?: string;
    date?: string;
    category?: MealCategory | "";
    page?: number;
  }) {
    const params = new URLSearchParams();
    const nextSearch = next.search ?? activeSearch;
    const nextDate = next.date ?? activeDate;
    const nextCategory = next.category ?? activeCategory;
    const nextPage = next.page ?? Math.floor(offset / PAGE_SIZE);
    if (nextSearch) params.set("q", nextSearch);
    if (nextDate) params.set("date", nextDate);
    if (nextCategory) params.set("category", nextCategory);
    if (nextPage > 0) params.set("page", String(nextPage));
    const query = params.toString();
    navigate(`/meals${query ? `?${query}` : ""}`, true);
  }

  function applyFilters() {
    const nextSearch = search.trim();
    const nextDate = date.trim();
    setActiveSearch(nextSearch);
    setActiveDate(nextDate);
    setActiveCategory(category);
    setOffset(0);
    updateUrl({ search: nextSearch, date: nextDate, category, page: 0 });
  }

  function clearFilters() {
    setSearch("");
    setActiveSearch("");
    setDate("");
    setActiveDate("");
    setCategory("");
    setActiveCategory("");
    setOffset(0);
    updateUrl({ search: "", date: "", category: "", page: 0 });
  }

  const hasFilters = Boolean(activeSearch || activeDate || activeCategory);

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <Text as="h2" variant="headingLg">
          Meals
        </Text>
        <Text tone="secondary">Inspect confirmed meal records across the product.</Text>
      </div>
      <Surface className="admin-resource-surface">
        <div className="admin-resource-heading">
          <div>
            <Text as="h3" variant="headingMd">
              Meal directory
            </Text>
            <Text variant="bodySm" tone="secondary">
              {total} {total === 1 ? "meal" : "meals"}
            </Text>
          </div>
          <Text variant="caption" tone="secondary">
            Create and edit from a user workspace.
          </Text>
        </div>
        <form
          className="admin-filter-bar admin-filter-bar-wide"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <Field fieldId="meal-search" label="Search meals or users">
            <Input
              id="meal-search"
              placeholder="Name, email, or meal"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
          <Field fieldId="meal-date" label="Date">
            <Input
              id="meal-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Field fieldId="meal-category" label="Category">
            <select
              id="meal-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as MealCategory | "")}
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          {hasFilters ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
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
              {hasFilters
                ? "Try a different filter set."
                : "Meal records will appear here when users log meals."}
            </Text>
          </div>
        ) : null}
        {meals.length > 0 ? <GlobalMealTable meals={meals} /> : null}
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

function GlobalMealTable({ meals }: { meals: AdminGlobalMeal[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Meal</th>
            <th scope="col">User</th>
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
                <AdminLink className="admin-table-primary" to={mealPath(meal.id)}>
                  {meal.name}
                </AdminLink>
                <span className="admin-table-secondary">{meal.source}</span>
              </td>
              <td>
                <AdminLink className="admin-table-primary" to={userPath(meal.user.id)}>
                  {meal.user.name}
                </AdminLink>
                <span className="admin-table-secondary">{meal.user.email}</span>
              </td>
              <td>{meal.category}</td>
              <td>{meal.date}</td>
              <td>
                <span className="admin-numeric">{meal.calories} kcal</span>
                <span className="admin-table-secondary">
                  P {meal.proteinGrams} · C {meal.carbohydratesGrams} · F {meal.fatGrams} g
                </span>
              </td>
              <td className="admin-table-action">
                <AdminLink className="admin-text-link" to={mealPath(meal.id)}>
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

export function GlobalMealDetailPage({ mealId }: { mealId: string }) {
  const { navigate } = useAdminRouter();
  const [meal, setMeal] = useState<AdminGlobalMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let mounted = true;
    void fetchAdminMeal(mealId)
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
  }, [mealId]);

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
        <Text as="h2" variant="headingLg">
          Meal not found
        </Text>
        <Text tone="secondary">{error ?? "This meal is unavailable."}</Text>
        <AdminLink className="admin-text-link" to="/meals">
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
      await removeAdminMeal(currentMeal.user.id, currentMeal.id);
      navigate("/meals");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove meal");
      setRemoving(false);
    }
  }

  return (
    <div className="admin-route-content">
      <nav aria-label="Breadcrumbs" className="admin-breadcrumbs">
        <AdminLink to="/meals">Meals</AdminLink>
        <span aria-hidden="true">/</span>
        <span>{currentMeal.name}</span>
      </nav>
      <div className="admin-route-intro admin-route-intro-row">
        <div>
          <Text as="h2" variant="headingLg">
            {currentMeal.name}
          </Text>
          <Text tone="secondary">Meal details and confirmed nutrition values.</Text>
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
            <dt>User</dt>
            <dd>
              <AdminLink className="admin-text-link" to={userPath(currentMeal.user.id)}>
                {currentMeal.user.name}
              </AdminLink>
              <span className="admin-table-secondary">{currentMeal.user.email}</span>
            </dd>
          </div>
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
        <MealForm
          key={currentMeal.id}
          meal={currentMeal}
          userId={currentMeal.user.id}
          onSaved={(nextMeal) =>
            setMeal((current) => (current ? { ...current, ...nextMeal } : current))
          }
        />
      </Surface>
      <MealEntries entries={currentMeal.entries} />
    </div>
  );
}
