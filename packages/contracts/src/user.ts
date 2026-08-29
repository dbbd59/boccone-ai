import { z } from "zod";

/**
 * Public shape of the authenticated user as exposed by `GET /api/me`.
 * Mirrors what Better Auth stores, minus sensitive fields.
 */
export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const meResponseSchema = z.object({
  user: authUserSchema,
});

export type MeResponse = z.infer<typeof meResponseSchema>;

/**
 * Admin-facing user record. Operational data only — never includes
 * credentials, AI keys, or session tokens.
 */
export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUsersQuerySchema = z.object({
  search: z.string().trim().min(1).max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

export const adminUsersResponseSchema = z.object({
  users: z.array(adminUserSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export type AdminUsersResponse = z.infer<typeof adminUsersResponseSchema>;
