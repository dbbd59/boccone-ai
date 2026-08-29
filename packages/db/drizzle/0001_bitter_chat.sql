ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';--> statement-breakpoint
UPDATE "user" SET "role" = 'user' WHERE "role" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
UPDATE "user" SET "banned" = false WHERE "banned" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "banned" SET NOT NULL;
