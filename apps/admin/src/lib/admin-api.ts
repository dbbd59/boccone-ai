import {
  banAdminUser,
  createAdminUser,
  getAdminUserDailyTargets,
  getAdminUser,
  listAdminAuditLogs,
  listAdminUsers,
  removeAdminUserDailyTargets,
  removeAdminUser,
  setAdminUserRole,
  unbanAdminUser,
  updateAdminUserDailyTargets,
  updateAdminUser,
  type AdminAuditLogsResponse,
  type AdminUser,
  type DailyTargets,
  type AdminUserBanRequest,
  type AdminUserCreateRequest,
  type AdminUserRoleRequest,
  type AdminUserUpdateRequest,
  type AdminUsersResponse,
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
