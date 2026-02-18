-- Add school_name to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS school_name TEXT;

-- Create settlements table
CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  split_config JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add settlement columns to quick_grades
ALTER TABLE quick_grades ADD COLUMN IF NOT EXISTS settlement_status TEXT NOT NULL DEFAULT 'unsettled';
ALTER TABLE quick_grades ADD COLUMN IF NOT EXISTS settlement_id TEXT REFERENCES settlements(id) ON DELETE SET NULL;
