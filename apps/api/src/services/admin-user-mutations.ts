import {
  adminMutationResponseSchema,
  adminUserResponseSchema,
  adminUserSchema,
  type AdminUser,
  type AdminUserBan,
  type AdminUserCreate,
  type AdminUserRole,
  type AdminUserUpdate,
} from "@boccone/contracts";

import { AppError } from "../errors";
import { callBetterAuthAdmin, type BetterAuthHandler } from "./better-auth-admin";

function parseAdminUser(value: unknown): AdminUser {
  return adminUserSchema.parse(value);
}

function parseAdminUserResponse(value: unknown): { user: AdminUser } {
  return adminUserResponseSchema.parse(value);
}

export async function createAdminUser(input: {
  handler: BetterAuthHandler;
  headers: Headers;
  data: AdminUserCreate;
}): Promise<AdminUser> {
  const result = parseAdminUserResponse(
    await callBetterAuthAdmin(input.handler, {
      path: "create-user",
      method: "POST",
      headers: input.headers,
      body: {
        email: input.data.email.toLowerCase(),
        password: input.data.password,
        name: input.data.name,
        role: input.data.role,
      },
      fallbackMessage: "Unable to create user",
    }),
  );
  return result.user;
}

export async function updateAdminUser(input: {
  handler: BetterAuthHandler;
  headers: Headers;
  userId: string;
  data: AdminUserUpdate;
}): Promise<AdminUser> {
  return parseAdminUser(
    await callBetterAuthAdmin(input.handler, {
      path: "update-user",
      method: "POST",
      headers: input.headers,
      body: {
        userId: input.userId,
        data: {
          ...(input.data.name !== undefined ? { name: input.data.name } : {}),
          ...(input.data.email !== undefined ? { email: input.data.email.toLowerCase() } : {}),
        },
      },
      fallbackMessage: "Unable to update user",
    }),
  );
}

export async function setAdminUserRole(input: {
  handler: BetterAuthHandler;
  headers: Headers;
  userId: string;
  data: AdminUserRole;
}): Promise<AdminUser> {
  const result = parseAdminUserResponse(
    await callBetterAuthAdmin(input.handler, {
      path: "set-role",
      method: "POST",
      headers: input.headers,
      body: { userId: input.userId, role: input.data.role },
      fallbackMessage: "Unable to change user role",
    }),
  );
  return result.user;
}

export async function banAdminUser(input: {
  handler: BetterAuthHandler;
  headers: Headers;
  userId: string;
  data: AdminUserBan;
}): Promise<AdminUser> {
  const result = parseAdminUserResponse(
    await callBetterAuthAdmin(input.handler, {
      path: "ban-user",
      method: "POST",
      headers: input.headers,
      body: {
        userId: input.userId,
        ...(input.data.reason ? { banReason: input.data.reason } : {}),
        ...(input.data.durationSeconds !== undefined
          ? { banExpiresIn: input.data.durationSeconds }
          : {}),
      },
      fallbackMessage: "Unable to ban user",
    }),
  );
  return result.user;
}

export async function unbanAdminUser(input: {
  handler: BetterAuthHandler;
  headers: Headers;
  userId: string;
}): Promise<AdminUser> {
  const result = parseAdminUserResponse(
    await callBetterAuthAdmin(input.handler, {
      path: "unban-user",
      method: "POST",
      headers: input.headers,
      body: { userId: input.userId },
      fallbackMessage: "Unable to unban user",
    }),
  );
  return result.user;
}

export async function removeAdminUser(input: {
  handler: BetterAuthHandler;
  headers: Headers;
  userId: string;
}): Promise<void> {
  adminMutationResponseSchema.parse(
    await callBetterAuthAdmin(input.handler, {
      path: "remove-user",
      method: "POST",
      headers: input.headers,
      body: { userId: input.userId },
      fallbackMessage: "Unable to remove user",
    }),
  );
}

export function assertNotSelf(actorUserId: string, targetUserId: string, message: string): void {
  if (actorUserId === targetUserId) throw new AppError("bad_request", message);
}
