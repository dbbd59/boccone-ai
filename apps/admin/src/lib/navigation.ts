export type UserSection = "overview" | "profile" | "meals" | "nutrition" | "account";

export type AdminRoute =
  | { kind: "overview" }
  | { kind: "users" }
  | { kind: "user"; userId: string; section: UserSection }
  | { kind: "user-meal"; userId: string; mealId: string }
  | { kind: "meals" }
  | { kind: "meal"; mealId: string }
  | { kind: "foods" }
  | { kind: "food"; foodId: string }
  | { kind: "food-submissions" }
  | { kind: "food-submission"; submissionId: string }
  | { kind: "nutrition" }
  | { kind: "analytics-overview" }
  | { kind: "analytics-nutrition" }
  | { kind: "analytics-foods" }
  | { kind: "analytics-ai" }
  | { kind: "audit" }
  | { kind: "ai-usage" }
  | { kind: "settings" }
  | { kind: "not-found" };

export function parseAdminRoute(pathname: string): AdminRoute {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean).map(decodeSegment);

  if (segments.length === 0) return { kind: "overview" };
  if (segments.length === 1) {
    if (segments[0] === "users") return { kind: "users" };
    if (segments[0] === "meals") return { kind: "meals" };
    if (segments[0] === "foods") return { kind: "foods" };
    if (segments[0] === "food-submissions") return { kind: "food-submissions" };
    if (segments[0] === "nutrition") return { kind: "nutrition" };
    if (segments[0] === "analytics") return { kind: "analytics-overview" };
    if (segments[0] === "audit-log") return { kind: "audit" };
    if (segments[0] === "ai-usage") return { kind: "ai-usage" };
    if (segments[0] === "settings") return { kind: "settings" };
    return { kind: "not-found" };
  }

  if (segments[0] === "analytics" && segments.length === 2) {
    if (segments[1] === "nutrition") return { kind: "analytics-nutrition" };
    if (segments[1] === "foods") return { kind: "analytics-foods" };
    if (segments[1] === "ai") return { kind: "analytics-ai" };
  }

  if (segments[0] === "meals" && segments[1] && segments.length === 2) {
    return { kind: "meal", mealId: segments[1] };
  }
  if (segments[0] === "foods" && segments[1] && segments.length === 2) {
    return { kind: "food", foodId: segments[1] };
  }
  if (segments[0] === "food-submissions" && segments[1] && segments.length === 2) {
    return { kind: "food-submission", submissionId: segments[1] };
  }

  if (segments[0] === "users" && segments[1]) {
    if (segments.length === 2) return { kind: "user", userId: segments[1], section: "overview" };
    const section = segments[2];
    if (segments.length === 3 && section && isUserSection(section)) {
      return { kind: "user", userId: segments[1], section };
    }
    if (segments.length === 4 && segments[2] === "meals" && segments[3]) {
      return { kind: "user-meal", userId: segments[1], mealId: segments[3] };
    }
  }

  return { kind: "not-found" };
}

export function userPath(userId: string, section: UserSection = "overview"): string {
  const base = `/users/${encodeURIComponent(userId)}`;
  return section === "overview" ? base : `${base}/${section}`;
}

export function userMealPath(userId: string, mealId: string): string {
  return `${userPath(userId, "meals")}/${encodeURIComponent(mealId)}`;
}

export function mealPath(mealId: string): string {
  return `/meals/${encodeURIComponent(mealId)}`;
}

export function foodPath(foodId: string): string {
  return `/foods/${encodeURIComponent(foodId)}`;
}

export function foodSubmissionPath(submissionId: string): string {
  return `/food-submissions/${encodeURIComponent(submissionId)}`;
}

export function isUserRouteActive(route: AdminRoute): boolean {
  return route.kind === "users" || route.kind === "user" || route.kind === "user-meal";
}

function isUserSection(value: string): value is UserSection {
  return (
    value === "overview" ||
    value === "profile" ||
    value === "meals" ||
    value === "nutrition" ||
    value === "account"
  );
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
