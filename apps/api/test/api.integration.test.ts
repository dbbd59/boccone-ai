import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import {
  adminAuditLogsResponseSchema,
  adminMutationResponseSchema,
  adminUserResponseSchema,
  adminUsersResponseSchema,
  healthResponseSchema,
} from "@boccone/contracts";
import { eq, user } from "@boccone/db";

import { createCookieJar, createTestHarness, uniqueEmail, type TestHarness } from "./helpers";

let harness: TestHarness;

beforeAll(async () => {
  harness = await createTestHarness();
});

afterAll(async () => {
  if (harness) await harness.cleanup();
});

function request(path: string, init: RequestInit = {}): Promise<Response> {
  return harness.app.handle(new Request(`http://localhost${path}`, init));
}

function requestWithCookie(
  path: string,
  jar: ReturnType<typeof createCookieJar>,
  init: RequestInit = {},
) {
  return harness.app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: { ...init.headers, Cookie: jar.header() },
    }),
  );
}

async function signUpAndSignIn(email: string, password = "correct-horse-42", name = "Test User") {
  const jar = createCookieJar();
  const signUpResponse = await request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  jar.capture(signUpResponse);
  expect(signUpResponse.status).toBe(200);
  return { jar, signUpResponse };
}

describe("health", () => {
  test("GET /api/health returns the contract shape", async () => {
    const response = await request("/api/health");
    expect(response.status).toBe(200);
    const body = healthResponseSchema.parse(await response.json());
    expect(body.service).toBe("boccone-api");
    expect(body.status).toBe("ok");
    const requestId = response.headers.get("x-request-id");
    if (!requestId) throw new Error("health response did not include a request id");
    expect(body.requestId).toBe(requestId);
  });

  test("preserves a caller-provided request id for tracing", async () => {
    const response = await request("/api/health", {
      headers: { "x-request-id": "health-test-request" },
    });
    const body = healthResponseSchema.parse(await response.json());
    expect(body.requestId).toBe("health-test-request");
    expect(response.headers.get("x-request-id")).toBe("health-test-request");
  });

  test("unknown routes return the shared 404 error contract", async () => {
    const response = await request("/api/definitely-not-a-route");
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("not_found");
  });
});

describe("authentication flows", () => {
  test("sign-up creates a user with the default role and returns a session", async () => {
    const email = uniqueEmail("signup");
    const { jar } = await signUpAndSignIn(email);

    const meResponse = await requestWithCookie("/api/me", jar);
    expect(meResponse.status).toBe(200);
    const body = (await meResponse.json()) as { user: { email: string; role: string } };
    expect(body.user.email).toBe(email);
    expect(body.user.role).toBe("user");
  });

  test("duplicate sign-up is rejected", async () => {
    const email = uniqueEmail("dup");
    await signUpAndSignIn(email);
    const second = await request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Other", email, password: "another-pass-42" }),
    });
    expect(second.status).toBe(422);
  });

  test("sign-in with the wrong password fails with 401", async () => {
    const email = uniqueEmail("wrongpw");
    await signUpAndSignIn(email);
    const response = await request("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "definitely-wrong-1" }),
    });
    expect(response.status).toBe(401);
  });

  test("sign-out invalidates the session", async () => {
    const email = uniqueEmail("signout");
    const { jar } = await signUpAndSignIn(email);

    const signOutResponse = await requestWithCookie("/api/auth/sign-out", jar, { method: "POST" });
    jar.capture(signOutResponse);
    expect(signOutResponse.status).toBe(200);

    const meResponse = await requestWithCookie("/api/me", jar);
    expect(meResponse.status).toBe(401);
  });

  test("forgot-password → email capture → reset → sign-in with new password", async () => {
    const email = uniqueEmail("reset");
    const oldPassword = "old-password-42";
    await signUpAndSignIn(email, oldPassword);

    const requestReset = await request("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, redirectTo: "boccone://reset-password" }),
    });
    expect(requestReset.status).toBe(200);
    expect(harness.resetEmails).toHaveLength(1);
    expect(harness.resetEmails[0]?.to).toBe(email);

    const resetUrl = new URL(harness.resetEmails[0]?.resetUrl ?? "");
    const callback = await request(`${resetUrl.pathname}${resetUrl.search}`);
    expect(callback.status).toBe(302);
    const callbackLocation = callback.headers.get("location");
    if (!callbackLocation) throw new Error("password reset callback did not redirect");
    const deepLink = new URL(callbackLocation);
    if (deepLink.protocol !== "boccone:") {
      throw new Error(
        `password reset callback did not return a Boccone deep link (protocol=${deepLink.protocol}, pathname=${deepLink.pathname}, hasError=${deepLink.searchParams.has("error")})`,
      );
    }
    const token = deepLink.searchParams.get("token");
    expect(token).toBeTruthy();

    const reset = await request("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword: "new-password-43" }),
    });
    expect(reset.status).toBe(200);

    const newSignIn = await request("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "new-password-43" }),
    });
    expect(newSignIn.status).toBe(200);

    const oldSignIn = await request("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: oldPassword }),
    });
    expect(oldSignIn.status).toBe(401);
  });

  test("password reset for unknown emails does not leak existence", async () => {
    const emailsBefore = harness.resetEmails.length;
    const response = await request("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail("ghost"),
        redirectTo: "http://localhost:3001/reset-password",
      }),
    });
    expect(response.status).toBe(200);
    expect(harness.resetEmails.length).toBe(emailsBefore);
  });
});

describe("authorization boundaries", () => {
  test("protected routes reject unauthenticated requests", async () => {
    const meResponse = await request("/api/me");
    expect(meResponse.status).toBe(401);
    const body = (await meResponse.json()) as { error: { code: string } };
    expect(body.error.code).toBe("unauthorized");

    const adminResponse = await request("/api/admin/users");
    expect(adminResponse.status).toBe(401);
  });

  test("a normal user cannot access admin routes", async () => {
    const email = uniqueEmail("pleb");
    const { jar } = await signUpAndSignIn(email);

    const response = await requestWithCookie("/api/admin/users", jar);
    expect(response.status).toBe(403);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");

    const mutationResponse = await requestWithCookie("/api/admin/users/not-theirs", jar, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Should not change" }),
    });
    expect(mutationResponse.status).toBe(403);
  });

  test("an admin can list users and the response matches the contract", async () => {
    const email = uniqueEmail("chief");
    const { jar } = await signUpAndSignIn(email);

    // Promote directly in the database — mirroring how the first admin is
    // bootstrapped in practice (CLI / migration), never via client input.
    const promoted = await harness.db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.email, email))
      .returning({ id: user.id });
    expect(promoted).toHaveLength(1);

    const response = await requestWithCookie("/api/admin/users", jar);
    expect(response.status).toBe(200);
    const body = adminUsersResponseSchema.parse(await response.json());
    expect(body.total).toBeGreaterThanOrEqual(1);
    const listed = body.users.find((entry) => entry.email === email);
    expect(listed?.role).toBe("admin");
    // Contract shape must never include credentials.
    for (const entry of body.users) {
      expect(Object.keys(entry)).not.toContain("password");
      expect(Object.keys(entry)).not.toContain("accounts");
    }
  });

  test("admin user search filters by email", async () => {
    const email = uniqueEmail("searchable");
    await signUpAndSignIn(email);
    const adminEmail = uniqueEmail("admin");
    const { jar } = await signUpAndSignIn(adminEmail);
    await harness.db.update(user).set({ role: "admin" }).where(eq(user.email, adminEmail));

    const response = await requestWithCookie(`/api/admin/users?search=${email}`, jar);
    expect(response.status).toBe(200);
    const body = adminUsersResponseSchema.parse(await response.json());
    expect(body.users).toHaveLength(1);
    expect(body.users[0]?.email).toBe(email);
  });

  test("a client-supplied user id is never trusted for identity", async () => {
    const email = uniqueEmail("spoof");
    const { jar } = await signUpAndSignIn(email);
    const victimEmail = uniqueEmail("victim");
    await signUpAndSignIn(victimEmail);

    // Even if a client claims another user id, /api/me resolves the session.
    const response = await requestWithCookie("/api/me", jar, {
      headers: { "x-user-id": "anything" },
    });
    const body = (await response.json()) as { user: { email: string } };
    expect(body.user.email).toBe(email);
  });

  test("an admin can manage a user and every mutation is audited", async () => {
    const adminEmail = uniqueEmail("operator");
    const { jar } = await signUpAndSignIn(adminEmail, "admin-password-42", "Admin Operator");
    const promoted = await harness.db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.email, adminEmail))
      .returning({ id: user.id });
    const adminId = promoted[0]?.id;
    if (!adminId) throw new Error("admin bootstrap did not return a user id");

    const selfRole = await requestWithCookie(`/api/admin/users/${adminId}/role`, jar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "user" }),
    });
    expect(selfRole.status).toBe(400);

    const selfBan = await requestWithCookie(`/api/admin/users/${adminId}/ban`, jar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "not allowed" }),
    });
    expect(selfBan.status).toBe(400);

    const selfRemove = await requestWithCookie(`/api/admin/users/${adminId}`, jar, {
      method: "DELETE",
    });
    expect(selfRemove.status).toBe(400);

    const targetEmail = uniqueEmail("managed");
    const createResponse = await requestWithCookie("/api/admin/users", jar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Managed User",
        email: targetEmail,
        password: "managed-password-42",
      }),
    });
    expect(createResponse.status).toBe(200);
    const created = adminUserResponseSchema.parse(await createResponse.json()).user;

    const detailResponse = await requestWithCookie(`/api/admin/users/${created.id}`, jar);
    expect(detailResponse.status).toBe(200);
    expect(adminUserResponseSchema.parse(await detailResponse.json()).user.email).toBe(targetEmail);

    const updateResponse = await requestWithCookie(`/api/admin/users/${created.id}`, jar, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Updated User" }),
    });
    expect(updateResponse.status).toBe(200);
    expect(adminUserResponseSchema.parse(await updateResponse.json()).user.name).toBe(
      "Updated User",
    );

    const roleResponse = await requestWithCookie(`/api/admin/users/${created.id}/role`, jar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    expect(roleResponse.status).toBe(200);
    expect(adminUserResponseSchema.parse(await roleResponse.json()).user.role).toBe("admin");

    const banResponse = await requestWithCookie(`/api/admin/users/${created.id}/ban`, jar, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "test suspension", durationSeconds: 3600 }),
    });
    expect(banResponse.status).toBe(200);
    const banned = adminUserResponseSchema.parse(await banResponse.json()).user;
    expect(banned.banned).toBe(true);
    expect(banned.banReason).toBe("test suspension");

    const unbanResponse = await requestWithCookie(`/api/admin/users/${created.id}/unban`, jar, {
      method: "POST",
    });
    expect(unbanResponse.status).toBe(200);
    expect(adminUserResponseSchema.parse(await unbanResponse.json()).user.banned).toBe(false);

    const removeResponse = await requestWithCookie(`/api/admin/users/${created.id}`, jar, {
      method: "DELETE",
    });
    expect(removeResponse.status).toBe(200);
    expect(adminMutationResponseSchema.parse(await removeResponse.json()).success).toBe(true);

    const removedDetail = await requestWithCookie(`/api/admin/users/${created.id}`, jar);
    expect(removedDetail.status).toBe(404);

    const auditResponse = await requestWithCookie("/api/admin/audit-logs?limit=20", jar);
    expect(auditResponse.status).toBe(200);
    const audit = adminAuditLogsResponseSchema.parse(await auditResponse.json());
    const targetActions = new Set(
      audit.logs.filter((log) => log.targetUserId === created.id).map((log) => log.action),
    );
    expect(targetActions).toEqual(
      new Set([
        "user_created",
        "user_updated",
        "user_role_changed",
        "user_banned",
        "user_unbanned",
        "user_removed",
      ]),
    );
  });
});
