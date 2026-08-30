ALTER TABLE "food_submissions" DROP CONSTRAINT "food_submissions_submitted_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "food_submissions" ADD CONSTRAINT "food_submissions_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;