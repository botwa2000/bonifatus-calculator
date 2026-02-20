-- Add default grading system and class level to user_profiles
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "default_grading_system_id" TEXT REFERENCES "grading_systems"("id");
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "default_class_level" INTEGER DEFAULT 1;
