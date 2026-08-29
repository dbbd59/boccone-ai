import { z } from "zod";

import { adminUserSchema } from "./user";

export const adminUserParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

export const adminUserUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.email().max(320).optional(),
  })
  .refine((value) => value.name !== undefined || value.email !== undefined, {
    message: "At least one user field is required",
  });

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(320),
  password: z.string().min(8).max(128),
  role: z.enum(["user", "admin"]).default("user"),
});

export const adminUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export const adminUserBanSchema = z.object({
  reason: z.string().trim().max(500).optional(),
  durationSeconds: z.number().int().min(60).max(31_536_000).optional(),
});

export const adminUserResponseSchema = z.object({
  user: adminUserSchema,
});

export type AdminUserUpdate = z.infer<typeof adminUserUpdateSchema>;
export type AdminUserCreate = z.infer<typeof adminUserCreateSchema>;
export type AdminUserRole = z.infer<typeof adminUserRoleSchema>;
export type AdminUserBan = z.infer<typeof adminUserBanSchema>;

export const adminMutationResponseSchema = z.object({
  success: z.literal(true),
});

export const adminAuditActionSchema = z.enum([
  "user_created",
  "user_updated",
  "user_role_changed",
  "user_banned",
  "user_unbanned",
  "user_removed",
]);

export type AdminAuditAction = z.infer<typeof adminAuditActionSchema>;

const auditMetadataValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const adminAuditLogSchema = z.object({
  id: z.string(),
  actorUserId: z.string(),
  targetUserId: z.string().nullable(),
  action: adminAuditActionSchema,
  metadata: z.record(z.string(), auditMetadataValueSchema),
  createdAt: z.coerce.date(),
});

export type AdminAuditLog = z.infer<typeof adminAuditLogSchema>;

export const adminAuditLogsResponseSchema = z.object({
  logs: z.array(adminAuditLogSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export type AdminAuditLogsResponse = z.infer<typeof adminAuditLogsResponseSchema>;

export const adminAuditLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminAuditLogsQuery = z.infer<typeof adminAuditLogsQuerySchema>;
