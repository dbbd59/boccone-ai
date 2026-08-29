import {
  adminAuditLogsResponseSchema,
  type AdminAuditAction,
  type AdminAuditLogsQuery,
  type AdminAuditLogsResponse,
} from "@boccone/contracts";
import { adminAuditLog, count, desc, type Database } from "@boccone/db";

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
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: count() }).from(adminAuditLog),
  ]);

  return adminAuditLogsResponseSchema.parse({
    logs: rows.map((row) => ({
      ...row,
      metadata: row.metadata ?? {},
    })),
    total: Number(totalRows[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  });
}
