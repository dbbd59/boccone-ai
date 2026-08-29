import {
  adminAuditLogsResponseSchema,
  type AdminAuditAction,
  type AdminAuditLogsQuery,
  type AdminAuditLogsResponse,
} from "@boccone/contracts";
import { adminAuditLog, count, desc, inArray, type Database, user } from "@boccone/db";

type AuditMetadata = Record<string, string | number | boolean>;

export async function recordAdminAuditLog(
  db: Database,
  input: {
    actorUserId: string;
    targetUserId?: string;
    action: AdminAuditAction;
    metadata?: AuditMetadata;
  },
): Promise<void> {
  await db.insert(adminAuditLog).values({
    id: crypto.randomUUID(),
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId ?? null,
    action: input.action,
    metadata: input.metadata ?? {},
  });
}

export async function listAdminAuditLogs(
  db: Database,
  query: AdminAuditLogsQuery,
): Promise<AdminAuditLogsResponse> {
  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt), desc(adminAuditLog.id))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: count() }).from(adminAuditLog),
  ]);

  const userIds = [
    ...new Set(
      rows.flatMap((row) => [row.actorUserId, ...(row.targetUserId ? [row.targetUserId] : [])]),
    ),
  ];
  const principals = userIds.length
    ? await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(inArray(user.id, userIds))
    : [];
  const principalsById = new Map(principals.map((principal) => [principal.id, principal]));

  return adminAuditLogsResponseSchema.parse({
    logs: rows.map((row) => ({
      ...row,
      metadata: row.metadata ?? {},
      actor: principalsById.get(row.actorUserId) ?? null,
      target: row.targetUserId ? (principalsById.get(row.targetUserId) ?? null) : null,
    })),
    total: Number(totalRows[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  });
}
