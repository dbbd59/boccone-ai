import { jsonb, pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").notNull(),
    targetUserId: text("target_user_id"),
    action: text("action").notNull(),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("admin_audit_log_actor_idx").on(table.actorUserId),
    index("admin_audit_log_target_idx").on(table.targetUserId),
    index("admin_audit_log_created_at_idx").on(table.createdAt),
  ],
);
