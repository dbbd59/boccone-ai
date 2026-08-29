import {
  adminUserSchema,
  adminUsersResponseSchema,
  type AdminUser,
  type AdminUsersQuery,
  type AdminUsersResponse,
} from "@boccone/contracts";

import { callBetterAuthAdmin, type BetterAuthHandler } from "./better-auth-admin";

const MAX_PAGE_SIZE = 100;

function parseAdminUser(value: unknown): AdminUser {
  return adminUserSchema.parse(value);
}

export async function listAdminUsers(input: {
  handler: BetterAuthHandler;
  headers: Headers;
  query: AdminUsersQuery;
}): Promise<AdminUsersResponse> {
  const limit = Math.min(input.query.limit, MAX_PAGE_SIZE);
  const result = adminUsersResponseSchema.pick({ users: true, total: true }).parse(
    await callBetterAuthAdmin(input.handler, {
      path: "list-users",
      method: "GET",
      headers: input.headers,
      query: {
        limit: String(limit),
        offset: String(input.query.offset),
        sortBy: "createdAt",
        sortDirection: "desc",
        ...(input.query.search
          ? {
              searchValue: input.query.search,
              searchField: "email",
              searchOperator: "contains",
            }
          : {}),
      },
      fallbackMessage: "Unable to load users",
    }),
  );

  return adminUsersResponseSchema.parse({
    users: result.users,
    total: result.total,
    limit,
    offset: input.query.offset,
  });
}

export async function getAdminUser(input: {
  handler: BetterAuthHandler;
  headers: Headers;
  userId: string;
}): Promise<AdminUser> {
  return parseAdminUser(
    await callBetterAuthAdmin(input.handler, {
      path: "get-user",
      method: "GET",
      headers: input.headers,
      query: { id: input.userId },
      fallbackMessage: "Unable to load user",
    }),
  );
}
