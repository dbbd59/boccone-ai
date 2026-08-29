import type { BocconeAuth } from "@boccone/auth";
import {
  adminUsersResponseSchema,
  type AdminUsersQuery,
  type AdminUsersResponse,
} from "@boccone/contracts";

const MAX_PAGE_SIZE = 100;

/**
 * List users for the admin back office. Delegates search/filter/pagination to
 * the Better Auth admin plugin, then re-validates the result against the
 * public contract so the API never leaks unexpected fields.
 */
export async function listAdminUsers(input: {
  auth: BocconeAuth;
  headers: Headers;
  query: AdminUsersQuery;
}): Promise<AdminUsersResponse> {
  const result = await input.auth.api.listUsers({
    query: {
      limit: Math.min(input.query.limit, MAX_PAGE_SIZE),
      offset: input.query.offset,
      sortBy: "createdAt",
      sortDirection: "desc",
      ...(input.query.search
        ? {
            searchValue: input.query.search,
            searchField: "email" as const,
            searchOperator: "contains" as const,
          }
        : {}),
    },
    headers: input.headers,
  });

  // Validate the plugin response into the contract shape (also guards against
  // accidental exposure of credentials/tokens).
  return adminUsersResponseSchema.parse({
    users: result.users ?? [],
    total: result.total ?? 0,
    limit: Math.min(input.query.limit, MAX_PAGE_SIZE),
    offset: input.query.offset,
  });
}
