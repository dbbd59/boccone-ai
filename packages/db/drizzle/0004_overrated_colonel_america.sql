CREATE TABLE "daily_targets" (
	"user_id" text PRIMARY KEY NOT NULL,
	"calories" integer,
	"protein_grams" integer,
	"carbohydrates_grams" integer,
	"fat_grams" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_targets" ADD CONSTRAINT "daily_targets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;