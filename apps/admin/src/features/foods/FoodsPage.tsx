import { useEffect, useState, type FormEvent } from "react";

import type {
  AdminFoodSubmission,
  AdminFoodUpdateRequest,
  Food,
  FoodSourceType,
  FoodStatus,
  FoodType,
  NutritionPer100g,
} from "@boccone/api-client";
import { Alert, Button, Field, Input, Surface, Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
import {
  approveAdminFoodSubmission,
  fetchAdminFood,
  fetchAdminFoodSubmission,
  fetchAdminFoodSubmissions,
  fetchAdminFoods,
  mergeAdminFoodSubmission,
  rejectAdminFoodSubmission,
  saveAdminFood,
} from "../../lib/admin-api";
import { useAdminRouter } from "../../lib/navigation-context";
import { foodPath, foodSubmissionPath } from "../../lib/navigation";

const PAGE_SIZE = 20;
const STATUSES: FoodStatus[] = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "MERGED"];
const SOURCES: FoodSourceType[] = [
  "USDA",
  "OPEN_FOOD_FACTS",
  "CREA",
  "BOCCONE_CURATED",
  "USER_SUBMITTED",
  "AI_ESTIMATE",
];
const FOOD_TYPES: FoodType[] = ["generic", "branded", "dish"];

export function FoodsPage() {
  const { navigate } = useAdminRouter();
  const initialQuery = new URLSearchParams(window.location.search);
  const [foods, setFoods] = useState<Food[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(initialQuery.get("q") ?? "");
  const [activeSearch, setActiveSearch] = useState(initialQuery.get("q") ?? "");
  const [status, setStatus] = useState<FoodStatus | "">(
    (initialQuery.get("status") as FoodStatus | "") || "",
  );
  const [activeStatus, setActiveStatus] = useState<FoodStatus | "">(
    (initialQuery.get("status") as FoodStatus | "") || "",
  );
  const [sourceType, setSourceType] = useState<FoodSourceType | "">(
    (initialQuery.get("source") as FoodSourceType | "") || "",
  );
  const [activeSourceType, setActiveSourceType] = useState<FoodSourceType | "">(
    (initialQuery.get("source") as FoodSourceType | "") || "",
  );
  const [offset, setOffset] = useState(Number(initialQuery.get("page") ?? 0) * PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // This effect synchronizes the catalog table with the remote request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void fetchAdminFoods({
      search: activeSearch || undefined,
      status: activeStatus || undefined,
      sourceType: activeSourceType || undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then((result) => {
        if (!mounted) return;
        setFoods(result.foods);
        setTotal(result.total);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load foods");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeSearch, activeSourceType, activeStatus, offset]);

  function updateUrl(next: {
    search?: string;
    status?: FoodStatus | "";
    sourceType?: FoodSourceType | "";
    page?: number;
  }) {
    const params = new URLSearchParams();
    const nextSearch = next.search ?? activeSearch;
    const nextStatus = next.status ?? activeStatus;
    const nextSource = next.sourceType ?? activeSourceType;
    const nextPage = next.page ?? Math.floor(offset / PAGE_SIZE);
    if (nextSearch) params.set("q", nextSearch);
    if (nextStatus) params.set("status", nextStatus);
    if (nextSource) params.set("source", nextSource);
    if (nextPage > 0) params.set("page", String(nextPage));
    const query = params.toString();
    navigate(`/foods${query ? `?${query}` : ""}`, true);
  }

  function applyFilters() {
    const nextSearch = search.trim();
    setActiveSearch(nextSearch);
    setActiveStatus(status);
    setActiveSourceType(sourceType);
    setOffset(0);
    updateUrl({ search: nextSearch, status, sourceType, page: 0 });
  }

  function clearFilters() {
    setSearch("");
    setActiveSearch("");
    setStatus("");
    setActiveStatus("");
    setSourceType("");
    setActiveSourceType("");
    setOffset(0);
    updateUrl({ search: "", status: "", sourceType: "", page: 0 });
  }

  const hasFilters = Boolean(activeSearch || activeStatus || activeSourceType);

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <Text as="h2" variant="headingLg">
          Food catalog
        </Text>
        <Text tone="secondary">Inspect and correct foods used by meal composition.</Text>
      </div>
      <Surface className="admin-resource-surface">
        <div className="admin-resource-heading">
          <div>
            <Text as="h3" variant="headingMd">
              Catalog
            </Text>
            <Text variant="bodySm" tone="secondary">
              {total} {total === 1 ? "food" : "foods"}
            </Text>
          </div>
          <AdminLink className="admin-inline-link" to="/food-submissions">
            Review submissions →
          </AdminLink>
        </div>
        <form
          className="admin-filter-bar admin-filter-bar-wide"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <Field fieldId="food-search" label="Search foods">
            <Input
              id="food-search"
              placeholder="Name, brand, or alias"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
          <Field fieldId="food-status" label="Status">
            <select
              id="food-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as FoodStatus | "")}
            >
              <option value="">All statuses</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {formatEnum(value)}
                </option>
              ))}
            </select>
          </Field>
          <Field fieldId="food-source" label="Source">
            <select
              id="food-source"
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as FoodSourceType | "")}
            >
              <option value="">All sources</option>
              {SOURCES.map((value) => (
                <option key={value} value={value}>
                  {formatEnum(value)}
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
            Loading food catalog…
          </Text>
        ) : null}
        {!loading && foods.length === 0 ? (
          <div className="admin-empty-state">
            <Text variant="headingSm">No foods found</Text>
            <Text variant="bodySm" tone="secondary">
              {hasFilters ? "Try a different filter set." : "The catalog has no matching foods."}
            </Text>
          </div>
        ) : null}
        {foods.length > 0 ? <FoodTable foods={foods} /> : null}
        <Pagination
          loading={loading}
          offset={offset}
          total={total}
          onPage={(next) => {
            setOffset(next);
            updateUrl({ page: Math.floor(next / PAGE_SIZE) });
          }}
        />
      </Surface>
    </div>
  );
}

function FoodTable({ foods }: { foods: Food[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Food</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Source</th>
            <th scope="col">Nutrition / 100 g</th>
            <th scope="col">
              <span className="admin-visually-hidden">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {foods.map((food) => (
            <tr key={food.id}>
              <td>
                <AdminLink className="admin-table-primary" to={foodPath(food.id)}>
                  {food.name}
                </AdminLink>
                <span className="admin-table-secondary">{food.brand ?? food.category ?? "—"}</span>
              </td>
              <td>{formatEnum(food.type)}</td>
              <td>
                <span className={`admin-status is-${statusClass(food.status)}`}>
                  {formatEnum(food.status)}
                </span>
              </td>
              <td>{formatEnum(food.sourceType)}</td>
              <td>
                <span className="admin-numeric">
                  {food.nutritionPer100g.energyKcal ?? "—"} kcal
                </span>
                <span className="admin-table-secondary">
                  P {food.nutritionPer100g.proteinG ?? "—"} · C{" "}
                  {food.nutritionPer100g.carbohydratesG ?? "—"} · F{" "}
                  {food.nutritionPer100g.fatG ?? "—"} g
                </span>
              </td>
              <td className="admin-table-action">
                <AdminLink className="admin-text-link" to={foodPath(food.id)}>
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

export function FoodDetailPage({ foodId }: { foodId: string }) {
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetchAdminFood(foodId)
      .then((nextFood) => {
        if (mounted) setFood(nextFood);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load food");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [foodId]);

  if (loading) return <LoadingState message="Loading food details…" />;
  if (!food) {
    return (
      <NotFoundState
        title="Food not found"
        message={error ?? "This food is unavailable."}
        backTo="/foods"
        backLabel="Back to catalog"
      />
    );
  }

  return (
    <div className="admin-route-content">
      <nav aria-label="Breadcrumbs" className="admin-breadcrumbs">
        <AdminLink to="/foods">Food catalog</AdminLink>
        <span aria-hidden="true">/</span>
        <span>{food.name}</span>
      </nav>
      <div className="admin-route-intro admin-route-intro-row">
        <div>
          <Text as="h2" variant="headingLg">
            {food.name}
          </Text>
          <Text tone="secondary">Catalog data and nutrition values.</Text>
        </div>
        <span className={`admin-status is-${statusClass(food.status)}`}>
          {formatEnum(food.status)}
        </span>
      </div>
      {error ? <Alert tone="danger" message={error} /> : null}
      <Surface>
        <dl className="admin-definition-grid">
          <Definition label="Type" value={formatEnum(food.type)} />
          <Definition label="Category" value={food.category ?? "—"} />
          <Definition label="Brand" value={food.brand ?? "—"} />
          <Definition label="Source" value={formatEnum(food.sourceType)} />
          <Definition label="Source name" value={food.sourceName ?? "—"} />
          <Definition label="Source ID" value={food.sourceId ?? "—"} />
          <Definition label="Source URL" value={food.sourceUrl ?? "—"} />
          <Definition label="Quality" value={formatEnum(food.qualityLevel)} />
          <Definition label="Barcode" value={food.barcode ?? "—"} />
          <Definition label="Portions" value={String(food.portions.length)} />
          <Definition label="Aliases" value={String(food.aliases.length)} />
          <Definition label="Food ID" value={food.id} wide />
        </dl>
      </Surface>
      <Surface>
        <FoodEditor food={food} onSaved={setFood} />
      </Surface>
      <Surface>
        <Text as="h3" variant="headingMd">
          Portions and aliases
        </Text>
        <div className="admin-food-reference-grid">
          <div>
            <Text variant="bodySm" tone="secondary">
              Portions
            </Text>
            {food.portions.length ? (
              <ul className="admin-chip-list">
                {food.portions.map((portion) => (
                  <li key={portion.id}>
                    {portion.name} · {portion.gramWeight} g
                  </li>
                ))}
              </ul>
            ) : (
              <Text variant="bodySm">No portions recorded.</Text>
            )}
          </div>
          <div>
            <Text variant="bodySm" tone="secondary">
              Aliases
            </Text>
            {food.aliases.length ? (
              <ul className="admin-chip-list">
                {food.aliases.map((alias) => (
                  <li key={alias.id}>
                    {alias.locale}: {alias.name}
                  </li>
                ))}
              </ul>
            ) : (
              <Text variant="bodySm">No aliases recorded.</Text>
            )}
          </div>
        </div>
      </Surface>
    </div>
  );
}

function FoodEditor({ food, onSaved }: { food: Food; onSaved: (food: Food) => void }) {
  const [draft, setDraft] = useState(() => toFoodDraft(food));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<Key extends keyof FoodDraft>(key: Key, value: FoodDraft[Key]) {
    setError(null);
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateNutrition(key: keyof NutritionPer100g, value: string) {
    setError(null);
    setSaved(false);
    setDraft((current) => ({ ...current, nutrition: { ...current.nutrition, [key]: value } }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = parseFoodDraft(draft);
    if (!input) {
      setError("Enter a name and valid non-negative nutrition values.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextFood = await saveAdminFood(food.id, input);
      onSaved(nextFood);
      setDraft(toFoodDraft(nextFood));
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update food");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-food-editor" onSubmit={(event) => void save(event)}>
      <div>
        <Text as="h3" variant="headingMd">
          Edit catalog data
        </Text>
        <Text variant="bodySm" tone="secondary">
          Correct source-backed values. Changes are recorded in the audit log.
        </Text>
      </div>
      <div className="admin-form-grid">
        <Field fieldId="food-name-edit" label="Name" required>
          <Input
            id="food-name-edit"
            required
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </Field>
        <Field fieldId="food-brand-edit" label="Brand">
          <Input
            id="food-brand-edit"
            value={draft.brand}
            onChange={(event) => update("brand", event.target.value)}
          />
        </Field>
        <Field fieldId="food-category-edit" label="Category">
          <Input
            id="food-category-edit"
            value={draft.category}
            onChange={(event) => update("category", event.target.value)}
          />
        </Field>
        <Field fieldId="food-type-edit" label="Type">
          <select
            id="food-type-edit"
            value={draft.type}
            onChange={(event) => update("type", event.target.value as FoodType)}
          >
            {FOOD_TYPES.map((value) => (
              <option key={value} value={value}>
                {formatEnum(value)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div>
        <Text as="h4" variant="headingSm">
          Nutrition per 100 g
        </Text>
        <div className="admin-form-grid admin-food-nutrition-grid">
          {(Object.keys(draft.nutrition) as (keyof NutritionPer100g)[]).map((key) => (
            <Field key={key} fieldId={`food-${key}`} label={nutritionLabel(key)}>
              <Input
                id={`food-${key}`}
                min="0"
                step="0.01"
                type="number"
                value={draft.nutrition[key]}
                onChange={(event) => updateNutrition(key, event.target.value)}
              />
            </Field>
          ))}
        </div>
      </div>
      <Field fieldId="food-aliases-edit" label="Aliases (one locale:name per line)">
        <textarea
          id="food-aliases-edit"
          value={draft.aliases}
          onChange={(event) => update("aliases", event.target.value)}
        />
      </Field>
      <Field fieldId="food-portions-edit" label="Portions (name|grams per line)">
        <textarea
          id="food-portions-edit"
          value={draft.portions}
          onChange={(event) => update("portions", event.target.value)}
        />
      </Field>
      {error ? <Alert tone="danger" message={error} /> : null}
      {saved ? (
        <Text role="status" tone="positive">
          Food updated.
        </Text>
      ) : null}
      <div className="admin-form-actions">
        <Button loading={loading} type="submit">
          Save food
        </Button>
      </div>
    </form>
  );
}

export function FoodSubmissionsPage() {
  const { navigate } = useAdminRouter();
  const initialQuery = new URLSearchParams(window.location.search);
  const [status, setStatus] = useState<FoodStatus>(
    (initialQuery.get("status") as FoodStatus | null) ?? "PENDING_REVIEW",
  );
  const [submissions, setSubmissions] = useState<AdminFoodSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(Number(initialQuery.get("page") ?? 0) * PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // This effect synchronizes the moderation queue with the remote request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void fetchAdminFoodSubmissions({ status, limit: PAGE_SIZE, offset })
      .then((result) => {
        if (!mounted) return;
        setSubmissions(result.submissions);
        setTotal(result.total);
      })
      .catch((cause) => {
        if (mounted)
          setError(cause instanceof Error ? cause.message : "Unable to load submissions");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [offset, status]);

  function changeStatus(nextStatus: FoodStatus) {
    setStatus(nextStatus);
    setOffset(0);
    navigate(`/food-submissions?status=${nextStatus}`, true);
  }

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <Text as="h2" variant="headingLg">
          Food review
        </Text>
        <Text tone="secondary">
          Moderate user-submitted foods before they enter the shared catalog.
        </Text>
      </div>
      <Surface className="admin-resource-surface">
        <div className="admin-resource-heading">
          <div>
            <Text as="h3" variant="headingMd">
              Submission queue
            </Text>
            <Text variant="bodySm" tone="secondary">
              {total} {total === 1 ? "submission" : "submissions"}
            </Text>
          </div>
          <Field fieldId="submission-status" label="Status">
            <select
              id="submission-status"
              value={status}
              onChange={(event) => changeStatus(event.target.value as FoodStatus)}
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {formatEnum(value)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {error ? <Alert tone="danger" message={error} /> : null}
        {loading ? (
          <Text role="status" tone="secondary">
            Loading submissions…
          </Text>
        ) : null}
        {!loading && submissions.length === 0 ? (
          <div className="admin-empty-state">
            <Text variant="headingSm">No submissions in this queue</Text>
            <Text variant="bodySm" tone="secondary">
              Choose another status or wait for a new user submission.
            </Text>
          </div>
        ) : null}
        {submissions.length > 0 ? <SubmissionTable submissions={submissions} /> : null}
        <Pagination
          loading={loading}
          offset={offset}
          total={total}
          onPage={(next) => {
            setOffset(next);
            navigate(
              `/food-submissions?status=${status}&page=${Math.floor(next / PAGE_SIZE)}`,
              true,
            );
          }}
        />
      </Surface>
    </div>
  );
}

function SubmissionTable({ submissions }: { submissions: AdminFoodSubmission[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Food</th>
            <th scope="col">Submitter</th>
            <th scope="col">Nutrition / 100 g</th>
            <th scope="col">Flags</th>
            <th scope="col">Created</th>
            <th scope="col">
              <span className="admin-visually-hidden">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id}>
              <td>
                <AdminLink className="admin-table-primary" to={foodSubmissionPath(submission.id)}>
                  {submission.food.name}
                </AdminLink>
                <span className="admin-table-secondary">
                  {formatEnum(submission.food.sourceType)}
                </span>
              </td>
              <td>
                <span className="admin-table-primary">{submission.submitter.name}</span>
                <span className="admin-table-secondary">{submission.submitter.email}</span>
              </td>
              <td>
                <span className="admin-numeric">
                  {submission.food.nutritionPer100g.energyKcal ?? "—"} kcal
                </span>
                <span className="admin-table-secondary">
                  P {submission.food.nutritionPer100g.proteinG ?? "—"} · C{" "}
                  {submission.food.nutritionPer100g.carbohydratesG ?? "—"} · F{" "}
                  {submission.food.nutritionPer100g.fatG ?? "—"} g
                </span>
              </td>
              <td>
                {submission.validationFlags.length
                  ? `${submission.validationFlags.length} flag${submission.validationFlags.length === 1 ? "" : "s"}`
                  : "Clear"}
                {submission.possibleDuplicates.length
                  ? ` · ${submission.possibleDuplicates.length} possible duplicate${submission.possibleDuplicates.length === 1 ? "" : "s"}`
                  : ""}
              </td>
              <td>{new Date(submission.createdAt).toLocaleString()}</td>
              <td className="admin-table-action">
                <AdminLink className="admin-text-link" to={foodSubmissionPath(submission.id)}>
                  Review
                </AdminLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FoodSubmissionDetailPage({ submissionId }: { submissionId: string }) {
  const { navigate } = useAdminRouter();
  const [submission, setSubmission] = useState<AdminFoodSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "reject" | "merge" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  useEffect(() => {
    let mounted = true;
    void fetchAdminFoodSubmission(submissionId)
      .then((nextSubmission) => {
        if (mounted) {
          setSubmission(nextSubmission);
          setMergeTarget(nextSubmission.possibleDuplicates[0]?.id ?? "");
        }
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load submission");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [submissionId]);

  if (loading) return <LoadingState message="Loading submission…" />;
  if (!submission) {
    return (
      <NotFoundState
        title="Submission not found"
        message={error ?? "This submission is unavailable."}
        backTo="/food-submissions"
        backLabel="Back to review"
      />
    );
  }

  const currentSubmission = submission;

  async function runAction(kind: "approve" | "reject" | "merge") {
    if (kind === "approve" && !window.confirm(`Approve ${currentSubmission.food.name}?`)) return;
    if (kind === "reject" && !window.confirm(`Reject ${currentSubmission.food.name}?`)) return;
    if (kind === "merge" && !mergeTarget) {
      setError("Select a target food before merging.");
      return;
    }
    setAction(kind);
    setError(null);
    try {
      const next =
        kind === "approve"
          ? await approveAdminFoodSubmission(currentSubmission.id)
          : kind === "reject"
            ? await rejectAdminFoodSubmission(currentSubmission.id, reason.trim() || undefined)
            : await mergeAdminFoodSubmission(currentSubmission.id, mergeTarget);
      setSubmission(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to ${kind} submission`);
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="admin-route-content">
      <nav aria-label="Breadcrumbs" className="admin-breadcrumbs">
        <AdminLink to="/food-submissions">Food review</AdminLink>
        <span aria-hidden="true">/</span>
        <span>{submission.food.name}</span>
      </nav>
      <div className="admin-route-intro admin-route-intro-row">
        <div>
          <Text as="h2" variant="headingLg">
            Review {submission.food.name}
          </Text>
          <Text tone="secondary">Submitted by {submission.submitter.name}.</Text>
        </div>
        <span className={`admin-status is-${statusClass(submission.status)}`}>
          {formatEnum(submission.status)}
        </span>
      </div>
      {error ? <Alert tone="danger" message={error} /> : null}
      <Surface>
        <dl className="admin-definition-grid">
          <Definition label="Food" value={submission.food.name} />
          <Definition
            label="Submitter"
            value={`${submission.submitter.name} · ${submission.submitter.email}`}
          />
          <Definition label="Type" value={formatEnum(submission.food.type)} />
          <Definition label="Brand" value={submission.food.brand ?? "—"} />
          <Definition label="Source" value={formatEnum(submission.food.sourceType)} />
          <Definition label="Source name" value={submission.food.sourceName ?? "—"} />
          <Definition label="Quality" value={formatEnum(submission.food.qualityLevel)} />
          <Definition
            label="Calories / 100 g"
            value={`${submission.food.nutritionPer100g.energyKcal ?? "—"} kcal`}
          />
          <Definition label="Created" value={new Date(submission.createdAt).toLocaleString()} />
          <Definition
            label="Reviewed"
            value={submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleString() : "—"}
          />
          <Definition label="Reviewed by" value={submission.reviewedBy ?? "—"} />
          <Definition label="Review reason" value={submission.reviewReason ?? "—"} />
        </dl>
      </Surface>
      <Surface>
        <Text as="h3" variant="headingMd">
          Validation
        </Text>
        {submission.validationFlags.length ? (
          <ul className="admin-food-flags">
            {submission.validationFlags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        ) : (
          <Text variant="bodySm" tone="positive">
            No validation flags.
          </Text>
        )}
        {submission.possibleDuplicates.length ? (
          <div className="admin-food-duplicates">
            <Text variant="bodySm" tone="secondary">
              Possible duplicates
            </Text>
            {submission.possibleDuplicates.map((food) => (
              <AdminLink className="admin-inline-link" key={food.id} to={foodPath(food.id)}>
                {food.name} →
              </AdminLink>
            ))}
          </div>
        ) : null}
      </Surface>
      {submission.status === "PENDING_REVIEW" ? (
        <Surface>
          <Text as="h3" variant="headingMd">
            Decision
          </Text>
          <Text variant="bodySm" tone="secondary">
            <AdminLink className="admin-inline-link" to={foodPath(submission.food.id)}>
              Edit catalog data before approval →
            </AdminLink>
          </Text>
          <div className="admin-food-actions">
            <Button
              loading={action === "approve"}
              disabled={action !== null}
              onClick={() => void runAction("approve")}
            >
              Approve
            </Button>
            <div className="admin-food-action-field">
              <Field fieldId="food-rejection-reason" label="Rejection reason">
                <Input
                  id="food-rejection-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </Field>
              <Button
                loading={action === "reject"}
                disabled={action !== null}
                type="button"
                variant="destructive"
                onClick={() => void runAction("reject")}
              >
                Reject
              </Button>
            </div>
            {submission.possibleDuplicates.length ? (
              <div className="admin-food-action-field">
                <Field fieldId="food-merge-target" label="Merge into">
                  <select
                    id="food-merge-target"
                    value={mergeTarget}
                    onChange={(event) => setMergeTarget(event.target.value)}
                  >
                    {submission.possibleDuplicates.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Button
                  loading={action === "merge"}
                  disabled={action !== null}
                  type="button"
                  variant="secondary"
                  onClick={() => void runAction("merge")}
                >
                  Merge
                </Button>
              </div>
            ) : null}
          </div>
        </Surface>
      ) : null}
      <Button type="button" variant="ghost" onClick={() => navigate("/food-submissions")}>
        Back to review queue
      </Button>
    </div>
  );
}

interface FoodDraft {
  name: string;
  brand: string;
  category: string;
  type: FoodType;
  aliases: string;
  portions: string;
  nutrition: Record<keyof NutritionPer100g, string>;
}

function toFoodDraft(food: Food): FoodDraft {
  return {
    name: food.name,
    brand: food.brand ?? "",
    category: food.category ?? "",
    type: food.type,
    aliases: food.aliases.map((alias) => `${alias.locale}:${alias.name}`).join("\n"),
    portions: food.portions.map((portion) => `${portion.name}|${portion.gramWeight}`).join("\n"),
    nutrition: Object.fromEntries(
      (Object.keys(food.nutritionPer100g) as (keyof NutritionPer100g)[]).map((key) => [
        key,
        food.nutritionPer100g[key] === null ? "" : String(food.nutritionPer100g[key]),
      ]),
    ) as Record<keyof NutritionPer100g, string>,
  };
}

function parseFoodDraft(draft: FoodDraft): AdminFoodUpdateRequest | null {
  const nutrition = {} as NutritionPer100g;
  for (const key of Object.keys(draft.nutrition) as (keyof NutritionPer100g)[]) {
    const value = draft.nutrition[key].trim();
    if (!value) {
      nutrition[key] = null;
      continue;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    nutrition[key] = parsed;
  }
  const aliases = draft.aliases
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(":");
      return separator > 1
        ? { locale: line.slice(0, separator).trim(), name: line.slice(separator + 1).trim() }
        : null;
    });
  const portions = draft.portions
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.lastIndexOf("|");
      if (separator <= 0) return null;
      const name = line.slice(0, separator).trim();
      const gramWeight = Number(line.slice(separator + 1).trim());
      return name && Number.isFinite(gramWeight) && gramWeight > 0
        ? {
            name,
            amount: 1,
            unit: "serving",
            gramWeight,
            isDefault: false,
          }
        : null;
    });
  const normalizedPortions = portions.map((portion, index) =>
    portion ? { ...portion, isDefault: index === 0 } : null,
  );
  if (
    !draft.name.trim() ||
    aliases.some((alias) => alias === null) ||
    normalizedPortions.some((portion) => portion === null)
  )
    return null;
  return {
    name: draft.name.trim(),
    brand: draft.brand.trim() || null,
    category: draft.category.trim() || null,
    type: draft.type,
    aliases: aliases as { locale: string; name: string }[],
    portions: normalizedPortions as {
      name: string;
      amount: number;
      unit: string;
      gramWeight: number;
      isDefault: boolean;
    }[],
    nutritionPer100g: nutrition,
  };
}

function nutritionLabel(key: keyof NutritionPer100g): string {
  const labels: Record<keyof NutritionPer100g, string> = {
    energyKcal: "Energy (kcal)",
    proteinG: "Protein (g)",
    carbohydratesG: "Carbohydrates (g)",
    fatG: "Fat (g)",
    fiberG: "Fiber (g)",
    sugarG: "Sugar (g)",
    saturatedFatG: "Saturated fat (g)",
    sodiumMg: "Sodium (mg)",
  };
  return labels[key];
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value: FoodStatus): string {
  return value.toLowerCase().replaceAll("_", "-");
}

function Definition({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "admin-definition-wide" : undefined}>
      <dt>{label}</dt>
      <dd className="admin-mono-wrap">{value}</dd>
    </div>
  );
}

function Pagination({
  loading,
  offset,
  total,
  onPage,
}: {
  loading: boolean;
  offset: number;
  total: number;
  onPage: (offset: number) => void;
}) {
  return (
    <div className="admin-pagination">
      <Text variant="bodySm" tone="secondary">
        {total === 0
          ? "No results"
          : `Showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}`}
      </Text>
      <div className="admin-pagination-actions">
        <Button
          disabled={loading || offset === 0}
          size="sm"
          type="button"
          variant="secondary"
          onClick={() => onPage(Math.max(0, offset - PAGE_SIZE))}
        >
          Previous
        </Button>
        <Button
          disabled={loading || offset + PAGE_SIZE >= total}
          size="sm"
          type="button"
          variant="secondary"
          onClick={() => onPage(offset + PAGE_SIZE)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="admin-route-state">
      <Text role="status" tone="secondary">
        {message}
      </Text>
    </div>
  );
}

function NotFoundState({
  title,
  message,
  backTo,
  backLabel,
}: {
  title: string;
  message: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <div className="admin-route-state">
      <Text as="h2" variant="headingLg">
        {title}
      </Text>
      <Text tone="secondary">{message}</Text>
      <AdminLink className="admin-text-link" to={backTo}>
        {backLabel}
      </AdminLink>
    </div>
  );
}
