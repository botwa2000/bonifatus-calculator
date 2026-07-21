-- Add school profile enhancement fields to user_profiles
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "school_town" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "semester_count" integer DEFAULT 2;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "program_length" integer DEFAULT 13;
