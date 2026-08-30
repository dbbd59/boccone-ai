ALTER TABLE "saved_meal_routines"
  RENAME COLUMN "meal_type" TO "default_category";
--> statement-breakpoint
ALTER TABLE "meal_provenance"
  DROP CONSTRAINT "meal_provenance_meal_id_meals_id_fk";
