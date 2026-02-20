-- Payment accounts for parents and children
CREATE TABLE IF NOT EXISTS "payment_accounts" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "account_type" TEXT NOT NULL, -- bank, paypal, wero, stripe
  "account_details" JSONB NOT NULL DEFAULT '{}', -- encrypted in app layer
  "is_default" BOOLEAN DEFAULT false NOT NULL,
  "label" TEXT,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "parent_id" TEXT NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "child_id" TEXT NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "settlement_id" TEXT REFERENCES "settlements"("id") ON DELETE SET NULL,
  "amount" REAL NOT NULL,
  "currency" TEXT DEFAULT 'EUR' NOT NULL,
  "method" TEXT DEFAULT 'cash' NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL, -- pending, completed, failed, cancelled
  "provider_reference" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "completed_at" TIMESTAMP
);

-- Point value configuration per parent (optionally per child)
CREATE TABLE IF NOT EXISTS "point_value_config" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "parent_id" TEXT NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "child_id" TEXT REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "point_value_cents" INTEGER DEFAULT 100 NOT NULL,
  "currency" TEXT DEFAULT 'EUR' NOT NULL,
  "cash_payout_pct" INTEGER DEFAULT 100 NOT NULL,
  "investment_pct" INTEGER DEFAULT 0 NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL
);
