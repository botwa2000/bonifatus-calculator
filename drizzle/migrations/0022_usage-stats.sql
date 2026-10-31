-- First-party usage statistics for the confidential /admin/stats dashboard.
-- Children use Bonifatus: no IP addresses, no user agents, no advertising IDs,
-- no third-party SDKs. Writers: lib/stats/usage.ts (usage_events, usage_installs,
-- action_log, feedback), lib/stats/store-import.ts (store_*). Retention is
-- enforced by purgeUsage() (instrumentation.ts, every 6 h).
-- Idempotent: safe to run more than once.

-- Client events from POST /api/t (web beacon + mobile apps).
CREATE TABLE IF NOT EXISTS usage_events (
  id           BIGSERIAL   PRIMARY KEY,
  ts           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform     TEXT        NOT NULL,            -- web | ios | android | app (unknown native)
  app_version  TEXT,
  install_id   TEXT,                            -- app install / consented web ID
  visitor_hash TEXT,                            -- daily-rotating hash for unconsented web
  user_id      TEXT,                            -- signed-in account (deleted with the account)
  event        TEXT        NOT NULL,
  screen       TEXT,                            -- web path or app route template
  props        JSONB,
  lang         TEXT,
  country      TEXT
);
CREATE INDEX IF NOT EXISTS usage_events_ts_idx ON usage_events (ts DESC);
CREATE INDEX IF NOT EXISTS usage_events_event_ts_idx ON usage_events (event, ts DESC);
CREATE INDEX IF NOT EXISTS usage_events_install_ts_idx ON usage_events (install_id, ts) WHERE install_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS usage_events_user_idx ON usage_events (user_id) WHERE user_id IS NOT NULL;

-- One row per core-action request (grade save, scan, settlement, invite, ...).
CREATE TABLE IF NOT EXISTS action_log (
  id           BIGSERIAL   PRIMARY KEY,
  ts           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform     TEXT        NOT NULL,
  app_version  TEXT,
  install_id   TEXT,
  visitor_hash TEXT,
  user_id      TEXT,
  action       TEXT        NOT NULL,
  source       TEXT,                            -- entry point / button (X-Source header)
  outcome      TEXT        NOT NULL,            -- ok | invalid | denied | rate_limited | fail
  status_code  SMALLINT,
  latency_ms   INTEGER,
  provider     TEXT,                            -- tesseract | fmp | db
  result_id    TEXT,                            -- id of the created row (joins feedback / content)
  lang         TEXT,
  country      TEXT
);
CREATE INDEX IF NOT EXISTS action_log_ts_idx ON action_log (ts DESC);
CREATE INDEX IF NOT EXISTS action_log_action_ts_idx ON action_log (action, ts DESC);
CREATE INDEX IF NOT EXISTS action_log_result_idx ON action_log (result_id) WHERE result_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS action_log_user_idx ON action_log (user_id) WHERE user_id IS NOT NULL;

-- First sighting of every install / consented web ID: new users, first-touch
-- acquisition and D1/D7 retention cohorts.
CREATE TABLE IF NOT EXISTS usage_installs (
  install_id     TEXT        PRIMARY KEY,
  platform       TEXT        NOT NULL,
  first_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_version  TEXT,
  user_id        TEXT,
  acq_source     TEXT,
  acq_medium     TEXT,
  acq_campaign   TEXT,
  country        TEXT
);
CREATE INDEX IF NOT EXISTS usage_installs_first_seen_idx ON usage_installs (first_seen DESC);
CREATE INDEX IF NOT EXISTS usage_installs_user_idx ON usage_installs (user_id) WHERE user_id IS NOT NULL;

-- Random salt per UTC day for the unconsented-web visitor hash. Rows older than
-- 2 days are deleted, after which no hash can be linked back to anything.
CREATE TABLE IF NOT EXISTS usage_salts (
  day  DATE PRIMARY KEY,
  salt TEXT NOT NULL
);

-- In-app feedback: app rating (1..5 + optional comment), result rating
-- (1..5 for one saved grade/scan, joined to action_log via result_id), and
-- contact-form messages (rating NULL; name/email only in the email, never here).
-- Comment text is nulled after 30 days.
CREATE TABLE IF NOT EXISTS feedback (
  id            BIGSERIAL   PRIMARY KEY,
  ts            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind          TEXT        NOT NULL,           -- app | result | contact
  platform      TEXT        NOT NULL,
  app_version   TEXT,
  install_id    TEXT,
  visitor_hash  TEXT,
  user_id       TEXT,
  rating        SMALLINT,
  comment       TEXT,
  result_id     TEXT,
  action        TEXT,
  lang          TEXT,
  country       TEXT
);
CREATE INDEX IF NOT EXISTS feedback_kind_ts_idx ON feedback (kind, ts DESC);
CREATE INDEX IF NOT EXISTS feedback_user_idx ON feedback (user_id) WHERE user_id IS NOT NULL;

-- Nightly store imports: one value per (day, platform, metric).
CREATE TABLE IF NOT EXISTS store_daily (
  day      DATE    NOT NULL,
  platform TEXT    NOT NULL,                    -- ios | android
  metric   TEXT    NOT NULL,
  value    NUMERIC NOT NULL,
  PRIMARY KEY (day, platform, metric)
);

-- Written store reviews (ASC customerReviews, Play reviews API / bulk reports).
CREATE TABLE IF NOT EXISTS store_reviews (
  platform    TEXT        NOT NULL,
  review_id   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL,
  rating      SMALLINT    NOT NULL,
  territory   TEXT,
  lang        TEXT,
  title       TEXT,
  body        TEXT,
  app_version TEXT,
  replied     BOOLEAN,
  PRIMARY KEY (platform, review_id)
);
CREATE INDEX IF NOT EXISTS store_reviews_created_idx ON store_reviews (created_at DESC);

-- Last run / error per store feed, shown in the dashboard health box.
CREATE TABLE IF NOT EXISTS store_import_status (
  source  TEXT PRIMARY KEY,
  ran_at  TIMESTAMPTZ NOT NULL,
  ok      BOOLEAN     NOT NULL,
  detail  TEXT
);

-- Durable sliding-window rate limits (admin OTP sends / wrong codes, feedback).
CREATE TABLE IF NOT EXISTS stats_rate_limits (
  bucket TEXT        NOT NULL,
  key    TEXT        NOT NULL,
  ts     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS stats_rate_limits_idx ON stats_rate_limits (bucket, key, ts DESC);

-- Small key/value store for importer bookkeeping.
CREATE TABLE IF NOT EXISTS stats_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
