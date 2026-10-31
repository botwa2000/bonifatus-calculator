-- "Real users" filter for /admin/stats (lib/stats/classify.ts, lib/stats/aggregate.ts).
--
-- Two sources of non-real traffic:
--   • per request, at write time → `traffic` column: 'review' (Apple App Review
--     network 17.0.0.0/8), 'test' (Firebase Test Lab / Play pre-launch devices),
--     'internal' (a browser that signed in to /admin/stats). Sticky per install.
--   • per account → stats_account_class: auto rules (team, store reviewers,
--     test accounts) plus manual overrides from the dashboard. class 'real'
--     is a manual override that keeps an account counted.
-- The stats_real_* views are the product and usage tables minus both.

ALTER TABLE usage_installs ADD COLUMN IF NOT EXISTS traffic TEXT;
ALTER TABLE usage_events   ADD COLUMN IF NOT EXISTS traffic TEXT;
ALTER TABLE action_log     ADD COLUMN IF NOT EXISTS traffic TEXT;
ALTER TABLE feedback       ADD COLUMN IF NOT EXISTS traffic TEXT;

CREATE TABLE IF NOT EXISTS stats_account_class (
  user_id    TEXT        PRIMARY KEY,
  class      TEXT        NOT NULL CHECK (class IN ('internal', 'review', 'test', 'real')),
  reason     TEXT,
  manual     BOOLEAN     NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW stats_excluded_users AS
  SELECT user_id FROM stats_account_class WHERE class <> 'real';

CREATE OR REPLACE VIEW stats_excluded_installs AS
  SELECT install_id FROM usage_installs
   WHERE traffic IS NOT NULL OR user_id IN (SELECT user_id FROM stats_excluded_users);

CREATE OR REPLACE VIEW stats_real_usage_installs AS
  SELECT * FROM usage_installs
   WHERE install_id NOT IN (SELECT install_id FROM stats_excluded_installs);

CREATE OR REPLACE VIEW stats_real_usage_events AS
  SELECT * FROM usage_events
   WHERE traffic IS NULL
     AND (user_id IS NULL OR user_id NOT IN (SELECT user_id FROM stats_excluded_users))
     AND (install_id IS NULL OR install_id NOT IN (SELECT install_id FROM stats_excluded_installs));

CREATE OR REPLACE VIEW stats_real_action_log AS
  SELECT * FROM action_log
   WHERE traffic IS NULL
     AND (user_id IS NULL OR user_id NOT IN (SELECT user_id FROM stats_excluded_users))
     AND (install_id IS NULL OR install_id NOT IN (SELECT install_id FROM stats_excluded_installs));

CREATE OR REPLACE VIEW stats_real_feedback AS
  SELECT * FROM feedback
   WHERE traffic IS NULL
     AND (user_id IS NULL OR user_id NOT IN (SELECT user_id FROM stats_excluded_users))
     AND (install_id IS NULL OR install_id NOT IN (SELECT install_id FROM stats_excluded_installs));

CREATE OR REPLACE VIEW stats_real_user_profiles AS
  SELECT * FROM user_profiles WHERE id NOT IN (SELECT user_id FROM stats_excluded_users);

CREATE OR REPLACE VIEW stats_real_quick_grades AS
  SELECT * FROM quick_grades WHERE child_id NOT IN (SELECT user_id FROM stats_excluded_users);

CREATE OR REPLACE VIEW stats_real_term_grades AS
  SELECT * FROM term_grades WHERE child_id NOT IN (SELECT user_id FROM stats_excluded_users);

CREATE OR REPLACE VIEW stats_real_subject_grades AS
  SELECT * FROM subject_grades WHERE term_grade_id IN (SELECT id FROM stats_real_term_grades);

CREATE OR REPLACE VIEW stats_real_settlements AS
  SELECT * FROM settlements
   WHERE (child_id IS NULL OR child_id NOT IN (SELECT user_id FROM stats_excluded_users))
     AND (parent_id IS NULL OR parent_id NOT IN (SELECT user_id FROM stats_excluded_users));

CREATE OR REPLACE VIEW stats_real_parent_child_relationships AS
  SELECT * FROM parent_child_relationships
   WHERE parent_id NOT IN (SELECT user_id FROM stats_excluded_users)
     AND (child_id IS NULL OR child_id NOT IN (SELECT user_id FROM stats_excluded_users));

CREATE OR REPLACE VIEW stats_real_parent_child_invites AS
  SELECT * FROM parent_child_invites
   WHERE parent_id NOT IN (SELECT user_id FROM stats_excluded_users)
     AND (child_id IS NULL OR child_id NOT IN (SELECT user_id FROM stats_excluded_users));
