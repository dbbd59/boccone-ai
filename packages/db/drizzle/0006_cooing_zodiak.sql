CREATE TABLE "food_aliases" (
	"id" text PRIMARY KEY NOT NULL,
	"food_id" text NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_portions" (
	"id" text PRIMARY KEY NOT NULL,
	"food_id" text NOT NULL,
	"name" text NOT NULL,
	"amount" real DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'serving' NOT NULL,
	"gram_weight" real NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"source_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"food_id" text NOT NULL,
	"submitted_by" text NOT NULL,
	"status" text DEFAULT 'PENDING_REVIEW' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_reason" text,
	"merged_into_food_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"type" text NOT NULL,
	"category" text,
	"brand" text,
	"barcode" text,
	"energy_kcal_per_100g" real,
	"protein_g_per_100g" real,
	"carbohydrates_g_per_100g" real,
	"fat_g_per_100g" real,
	"fiber_g_per_100g" real,
	"sugar_g_per_100g" real,
	"saturated_fat_g_per_100g" real,
	"sodium_mg_per_100g" real,
	"source_type" text NOT NULL,
	"source_id" text,
	"source_url" text,
	"quality_level" text NOT NULL,
	"status" text DEFAULT 'APPROVED' NOT NULL,
	"owner_user_id" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_food_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"meal_id" text NOT NULL,
	"food_id" text NOT NULL,
	"food_name_snapshot" text NOT NULL,
	"portion_name_snapshot" text NOT NULL,
	"quantity" real NOT NULL,
	"grams" real NOT NULL,
	"energy_kcal_snapshot" real,
	"protein_g_snapshot" real,
	"carbohydrates_g_snapshot" real,
	"fat_g_snapshot" real,
	"fiber_g_snapshot" real,
	"sugar_g_snapshot" real,
	"saturated_fat_g_snapshot" real,
	"sodium_mg_snapshot" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_aliases" ADD CONSTRAINT "food_aliases_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_portions" ADD CONSTRAINT "food_portions_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_submissions" ADD CONSTRAINT "food_submissions_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_submissions" ADD CONSTRAINT "food_submissions_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_submissions" ADD CONSTRAINT "food_submissions_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_submissions" ADD CONSTRAINT "food_submissions_merged_into_food_id_foods_id_fk" FOREIGN KEY ("merged_into_food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_food_entries" ADD CONSTRAINT "meal_food_entries_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_food_entries" ADD CONSTRAINT "meal_food_entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_aliases_normalized_name_idx" ON "food_aliases" USING btree ("normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "food_aliases_food_locale_name_idx" ON "food_aliases" USING btree ("food_id","locale","normalized_name");--> statement-breakpoint
CREATE INDEX "food_portions_food_idx" ON "food_portions" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "food_submissions_status_idx" ON "food_submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "food_submissions_submitter_idx" ON "food_submissions" USING btree ("submitted_by");--> statement-breakpoint
CREATE UNIQUE INDEX "food_submissions_food_idx" ON "food_submissions" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "foods_normalized_name_idx" ON "foods" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "foods_status_owner_idx" ON "foods" USING btree ("status","owner_user_id");--> statement-breakpoint
CREATE INDEX "foods_barcode_idx" ON "foods" USING btree ("barcode");--> statement-breakpoint
CREATE UNIQUE INDEX "foods_source_identity_idx" ON "foods" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "meal_food_entries_meal_idx" ON "meal_food_entries" USING btree ("meal_id");