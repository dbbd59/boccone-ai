import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** One provider/model selection per user. The API key is always encrypted. */
export const aiProviderConfigs = pgTable(
  "ai_provider_configs",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    /** Null only while onboarding is waiting for model discovery/selection. */
    model: text("model"),
    baseUrl: text("base_url"),
    encryptedApiKey: text("encrypted_api_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("ai_provider_configs_provider_idx").on(table.provider)],
);

/** Privacy-safe request ledger. Prompts and model responses are never stored. */
export const aiUsage = pgTable(
  "ai_usage",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    totalTokens: integer("total_tokens"),
    latencyMs: integer("latency_ms").notNull(),
    status: text("status").notNull(),
    errorCode: text("error_code"),
    providerRequestId: text("provider_request_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_usage_user_created_idx").on(table.userId, table.createdAt),
    index("ai_usage_created_at_idx").on(table.createdAt),
    index("ai_usage_feature_created_idx").on(table.feature, table.createdAt),
    index("ai_usage_status_created_idx").on(table.status, table.createdAt),
  ],
);
