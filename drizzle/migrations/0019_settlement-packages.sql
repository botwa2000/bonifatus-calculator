-- Add package metadata to settlements (settlement packages feature)
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "package_type" TEXT;
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "package_label" TEXT;

-- Add settlement period preference to user profiles (default: monthly)
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "settlement_period_unit" TEXT DEFAULT 'monthly';
