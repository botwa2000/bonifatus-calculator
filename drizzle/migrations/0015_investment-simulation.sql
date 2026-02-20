-- Investment simulations
CREATE TABLE IF NOT EXISTS "investment_simulations" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "parent_id" TEXT NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "child_id" TEXT REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "simulation_type" TEXT NOT NULL, -- savings, etf
  "config" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL
);
