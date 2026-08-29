import type { BocconeAuth } from "@boccone/auth";
import { adminUsersQuerySchema } from "@boccone/contracts";

import { createRequireAdmin } from "../../middleware/auth";
import { listAdminUsers } from "../../services/admin-users";

/** Every admin route requires a Better Auth session with role=admin. */
export function createAdminRoutes(auth: BocconeAuth) {
  return createRequireAdmin(auth).get("/api/admin/users", async ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const query = adminUsersQuerySchema.parse({
      search: optionalParam(searchParams.get("search")),
      limit: optionalParam(searchParams.get("limit")),
      offset: optionalParam(searchParams.get("offset")),
    });
    return listAdminUsers({ auth, headers: request.headers, query });
  });
}

function optionalParam(value: string | null): string | undefined {
  return value === null || value.length === 0 ? undefined : value;
}
