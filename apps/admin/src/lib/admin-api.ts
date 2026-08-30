import {
  banAdminUser,
  createAdminUser,
  createAdminUserMeal,
  getAdminUserMeal,
  getAdminUserDailyTargets,
  getAdminMeal,
  getAdminUser,
  listAdminMeals,
  listAdminUserMeals,
  listAdminAuditLogs,
  listAdminUsers,
  removeAdminUserDailyTargets,
  removeAdminUser,
  removeAdminUserMeal,
  setAdminUserRole,
  unbanAdminUser,
  updateAdminUserDailyTargets,
  updateAdminUser,
  updateAdminUserMeal,
  listAdminFoods,
  getAdminFood,
  updateAdminFood,
  listAdminFoodSubmissions,
  getAdminFoodSubmission,
  approveFoodSubmission,
  rejectFoodSubmission,
  mergeFoodSubmission,
  listAdminAiUsage,
  getAdminAnalyticsOverview,
  getAdminAnalyticsNutrition,
  getAdminAnalyticsFoods,
  getAdminAnalyticsAi,
  type AdminAuditLogsResponse,
  type AdminGlobalMeal,
  type AdminGlobalMealsResponse,
  type AdminUser,
  type DailyTargets,
  type AdminUserBanRequest,
  type AdminUserCreateRequest,
  type AdminUserRoleRequest,
  type AdminUserUpdateRequest,
  type AdminUsersResponse,
  type CreateMealRequest,
  type Meal,
  type UpdateMealRequest,
  type AdminMealsResponse,
  type AdminFoodsResponse,
  type Food,
  type AdminFoodSubmission,
  type AdminFoodSubmissionsResponse,
  type AdminFoodUpdateRequest,
  type AdminAiUsageResponse,
  type AdminOverviewResponse,
  type AdminNutritionResponse,
  type AdminCatalogResponse,
  type AdminAiAnalyticsResponse,
  type AdminAnalyticsRange,
} from "@boccone/api-client";

import { apiClient } from "./api-client";

export async function fetchAdminUsers(input: {
  search?: string;
  limit: number;
  offset: number;
}): Promise<AdminUsersResponse> {
  const result = await listAdminUsers({
    client: apiClient,
    query: {
      ...(input.search ? { search: input.search } : {}),
      limit: input.limit,
      offset: input.offset,
    },
  });
  return unwrap(result, "Unable to load users");
}

export async function fetchAdminUser(userId: string): Promise<AdminUser> {
  const result = await getAdminUser({ client: apiClient, path: { id: userId } });
  return unwrap(result, "Unable to load user").user;
}

export async function fetchAdminUserDailyTargets(userId: string): Promise<DailyTargets> {
  const result = await getAdminUserDailyTargets({ client: apiClient, path: { id: userId } });
  return unwrap(result, "Unable to load user targets").targets;
}

export async function updateAdminTargets(
  userId: string,
  targets: DailyTargets,
): Promise<DailyTargets> {
  const result = await updateAdminUserDailyTargets({
    client: apiClient,
    path: { id: userId },
    body: targets,
  });
  return unwrap(result, "Unable to update user targets").targets;
}

export async function removeAdminTargets(userId: string): Promise<void> {
  const result = await removeAdminUserDailyTargets({ client: apiClient, path: { id: userId } });
  unwrap(result, "Unable to remove user targets");
}

export async function fetchAdminUserMeals(
  userId: string,
  input: { date?: string; limit?: number; offset?: number } = {},
): Promise<AdminMealsResponse> {
  const result = await listAdminUserMeals({
    client: apiClient,
    path: { id: userId },
    query: {
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
      ...(input.date ? { date: input.date } : {}),
    },
  });
  return unwrap(result, "Unable to load user meals");
}

export async function fetchAdminUserMeal(userId: string, mealId: string): Promise<Meal> {
  const result = await getAdminUserMeal({
    client: apiClient,
    path: { id: userId, mealId },
  });
  return unwrap(result, "Unable to load meal").meal;
}

export async function fetchAdminMeals(input: {
  search?: string;
  date?: string;
  category?: "breakfast" | "lunch" | "dinner" | "snack";
  limit: number;
  offset: number;
}): Promise<AdminGlobalMealsResponse> {
  const result = await listAdminMeals({
    client: apiClient,
    query: {
      limit: input.limit,
      offset: input.offset,
      ...(input.search ? { search: input.search } : {}),
      ...(input.date ? { date: input.date } : {}),
      ...(input.category ? { category: input.category } : {}),
    },
  });
  return unwrap(result, "Unable to load meals");
}

export async function fetchAdminMeal(mealId: string): Promise<AdminGlobalMeal> {
  const result = await getAdminMeal({ client: apiClient, path: { id: mealId } });
  return unwrap(result, "Unable to load meal").meal;
}

export async function fetchAdminFoods(input: {
  search?: string;
  status?: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "MERGED";
  sourceType?:
    "USDA" | "OPEN_FOOD_FACTS" | "CREA" | "BOCCONE_CURATED" | "USER_SUBMITTED" | "AI_ESTIMATE";
  limit: number;
  offset: number;
}): Promise<AdminFoodsResponse> {
  const result = await listAdminFoods({ client: apiClient, query: { ...input } });
  return unwrap(result, "Unable to load foods");
}

export async function fetchAdminFood(foodId: string): Promise<Food> {
  const result = await getAdminFood({ client: apiClient, path: { id: foodId } });
  return unwrap(result, "Unable to load food").food;
}

export async function saveAdminFood(foodId: string, input: AdminFoodUpdateRequest): Promise<Food> {
  const result = await updateAdminFood({ client: apiClient, path: { id: foodId }, body: input });
  return unwrap(result, "Unable to update food").food;
}

export async function fetchAdminFoodSubmissions(input: {
  status?: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "MERGED";
  limit: number;
  offset: number;
}): Promise<AdminFoodSubmissionsResponse> {
  const result = await listAdminFoodSubmissions({ client: apiClient, query: { ...input } });
  return unwrap(result, "Unable to load food submissions");
}

export async function fetchAdminFoodSubmission(submissionId: string): Promise<AdminFoodSubmission> {
  const result = await getAdminFoodSubmission({ client: apiClient, path: { id: submissionId } });
  return unwrap(result, "Unable to load food submission").submission;
}

export async function approveAdminFoodSubmission(
  submissionId: string,
): Promise<AdminFoodSubmission> {
  const result = await approveFoodSubmission({ client: apiClient, path: { id: submissionId } });
  return unwrap(result, "Unable to approve food submission").submission;
}

export async function rejectAdminFoodSubmission(
  submissionId: string,
  reason?: string,
): Promise<AdminFoodSubmission> {
  const result = await rejectFoodSubmission({
    client: apiClient,
    path: { id: submissionId },
    body: reason ? { reason } : undefined,
  });
  return unwrap(result, "Unable to reject food submission").submission;
}

export async function mergeAdminFoodSubmission(
  submissionId: string,
  foodId: string,
): Promise<AdminFoodSubmission> {
  const result = await mergeFoodSubmission({
    client: apiClient,
    path: { id: submissionId },
    body: { foodId },
  });
  return unwrap(result, "Unable to merge food submission").submission;
}

export async function createAdminMeal(userId: string, data: CreateMealRequest): Promise<Meal> {
  const result = await createAdminUserMeal({
    client: apiClient,
    path: { id: userId },
    body: data,
  });
  return unwrap(result, "Unable to create user meal").meal;
}

export async function updateAdminMeal(
  userId: string,
  mealId: string,
  data: UpdateMealRequest,
): Promise<Meal> {
  const result = await updateAdminUserMeal({
    client: apiClient,
    path: { id: userId, mealId },
    body: data,
  });
  return unwrap(result, "Unable to update user meal").meal;
}

export async function removeAdminMeal(userId: string, mealId: string): Promise<void> {
  const result = await removeAdminUserMeal({
    client: apiClient,
    path: { id: userId, mealId },
  });
  unwrap(result, "Unable to remove user meal");
}

export async function createUser(data: AdminUserCreateRequest): Promise<AdminUser> {
  const result = await createAdminUser({ client: apiClient, body: data });
  return unwrap(result, "Unable to create user").user;
}

export async function updateUser(userId: string, data: AdminUserUpdateRequest): Promise<AdminUser> {
  const result = await updateAdminUser({
    client: apiClient,
    path: { id: userId },
    body: data,
  });
  return unwrap(result, "Unable to update user").user;
}

export async function setUserRole(userId: string, data: AdminUserRoleRequest): Promise<AdminUser> {
  const result = await setAdminUserRole({
    client: apiClient,
    path: { id: userId },
    body: data,
  });
  return unwrap(result, "Unable to change user role").user;
}

export async function banUser(userId: string, data: AdminUserBanRequest): Promise<AdminUser> {
  const result = await banAdminUser({
    client: apiClient,
    path: { id: userId },
    body: data,
  });
  return unwrap(result, "Unable to ban user").user;
}

export async function unbanUser(userId: string): Promise<AdminUser> {
  const result = await unbanAdminUser({ client: apiClient, path: { id: userId } });
  return unwrap(result, "Unable to unban user").user;
}

export async function removeUser(userId: string): Promise<void> {
  const result = await removeAdminUser({ client: apiClient, path: { id: userId } });
  unwrap(result, "Unable to remove user");
}

export async function fetchAdminAuditLogs(input: {
  limit: number;
  offset: number;
}): Promise<AdminAuditLogsResponse> {
  const result = await listAdminAuditLogs({
    client: apiClient,
    query: input,
  });
  return unwrap(result, "Unable to load audit logs");
}

export async function fetchAdminAiUsage(input: {
  limit: number;
  offset: number;
}): Promise<AdminAiUsageResponse> {
  const result = await listAdminAiUsage({ client: apiClient, query: input });
  return unwrap(result, "Unable to load AI usage");
}

export interface AdminAnalyticsQuery {
  range: AdminAnalyticsRange;
  from?: string;
  to?: string;
}

export async function fetchAdminAnalyticsOverview(
  input: AdminAnalyticsQuery,
): Promise<AdminOverviewResponse> {
  const result = await getAdminAnalyticsOverview({ client: apiClient, query: input });
  return unwrap(result, "Unable to load analytics overview");
}

export async function fetchAdminAnalyticsNutrition(
  input: AdminAnalyticsQuery,
): Promise<AdminNutritionResponse> {
  const result = await getAdminAnalyticsNutrition({ client: apiClient, query: input });
  return unwrap(result, "Unable to load nutrition analytics");
}

export async function fetchAdminAnalyticsFoods(
  input: AdminAnalyticsQuery,
): Promise<AdminCatalogResponse> {
  const result = await getAdminAnalyticsFoods({ client: apiClient, query: input });
  return unwrap(result, "Unable to load catalog analytics");
}

export async function fetchAdminAnalyticsAi(
  input: AdminAnalyticsQuery,
): Promise<AdminAiAnalyticsResponse> {
  const result = await getAdminAnalyticsAi({ client: apiClient, query: input });
  return unwrap(result, "Unable to load AI analytics");
}

function unwrap<T>(result: { data?: T; error?: unknown }, fallback: string): T {
  if (result.error) throw new Error(readErrorMessage(result.error) ?? fallback);
  if (result.data === undefined) throw new Error(fallback);
  return result.data;
}

function readErrorMessage(value: unknown): string | null {
  const record = asRecord(value);
  const nestedError = asRecord(record?.["error"]);
  if (typeof nestedError?.["message"] === "string") return nestedError["message"];
  if (typeof record?.["message"] === "string") return record["message"];
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}
