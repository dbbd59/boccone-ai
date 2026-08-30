CREATE TABLE "ai_provider_configs" (
	"user_id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"base_url" text,
	"encrypted_api_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"feature" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"latency_ms" integer NOT NULL,
	"status" text NOT NULL,
	"error_code" text,
	"provider_request_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "ai_provider_configs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_provider_configs_provider_idx" ON "ai_provider_configs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "ai_usage_user_created_idx" ON "ai_usage" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_feature_created_idx" ON "ai_usage" USING btree ("feature","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_status_created_idx" ON "ai_usage" USING btree ("status","created_at");