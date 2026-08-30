-- A provider key can be stored before model discovery completes.
ALTER TABLE "ai_provider_configs"
  ALTER COLUMN "model" DROP NOT NULL;
