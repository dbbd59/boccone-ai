CREATE TABLE "meal_provenance" (
	"meal_id" text PRIMARY KEY NOT NULL,
	"source_saved_meal_id" text,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_meal_items" (
	"id" text PRIMARY KEY NOT NULL,
	"saved_meal_id" text NOT NULL,
	"food_id" text,
	"food_name_fallback" text,
	"portion_id" text,
	"portion_name_fallback" text,
	"quantity" real NOT NULL,
	"grams" real NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_meal_routines" (
	"id" text PRIMARY KEY NOT NULL,
	"saved_meal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"meal_type" text,
	"weekdays" text DEFAULT '0,1,2,3,4' NOT NULL,
	"local_time" text DEFAULT '08:00' NOT NULL,
	"is_reminder_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_meals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"default_category" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_provenance" ADD CONSTRAINT "meal_provenance_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_meal_items" ADD CONSTRAINT "saved_meal_items_saved_meal_id_saved_meals_id_fk" FOREIGN KEY ("saved_meal_id") REFERENCES "public"."saved_meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_meal_items" ADD CONSTRAINT "saved_meal_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_meal_items" ADD CONSTRAINT "saved_meal_items_portion_id_food_portions_id_fk" FOREIGN KEY ("portion_id") REFERENCES "public"."food_portions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_meal_routines" ADD CONSTRAINT "saved_meal_routines_saved_meal_id_saved_meals_id_fk" FOREIGN KEY ("saved_meal_id") REFERENCES "public"."saved_meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_meal_routines" ADD CONSTRAINT "saved_meal_routines_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_meals" ADD CONSTRAINT "saved_meals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_provenance_saved_meal_idx" ON "meal_provenance" USING btree ("source_saved_meal_id");--> statement-breakpoint
CREATE INDEX "saved_meal_items_meal_idx" ON "saved_meal_items" USING btree ("saved_meal_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_meal_routines_meal_idx" ON "saved_meal_routines" USING btree ("saved_meal_id");--> statement-breakpoint
CREATE INDEX "saved_meal_routines_user_idx" ON "saved_meal_routines" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_meals_user_idx" ON "saved_meals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_meals_user_last_used_idx" ON "saved_meals" USING btree ("user_id","last_used_at");