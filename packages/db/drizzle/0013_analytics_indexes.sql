CREATE INDEX "user_created_at_idx" ON "user" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "meals_date_idx" ON "meals" USING btree ("meal_date");
--> statement-breakpoint
CREATE INDEX "meal_food_entries_food_idx" ON "meal_food_entries" USING btree ("food_id");
--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at");
