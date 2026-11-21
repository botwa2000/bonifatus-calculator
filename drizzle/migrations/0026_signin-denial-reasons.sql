-- /admin/stats: why a sign-in was refused, and failed attempts kept out of "real".
--
-- action_log.reason   what really happened, server-side only (the client gets the same
--                     answer for every password failure). Values:
--   password:  wrong_password | user_not_found | no_password | email_unverified | rate_limited | bad_request
--   google/apple: token_invalid | missing_token | no_email | bad_role
--   ok rows:   existing | new_account | needs_profile   (social sign-in)
-- action_log.user_id on a refused password attempt is the account that was tried,
-- when one exists; usage_installs.user_id is only ever set by a successful action.

ALTER TABLE action_log ADD COLUMN IF NOT EXISTS reason TEXT;

-- `SELECT *` views freeze their column list at creation; re-create to pick up reason.
CREATE OR REPLACE VIEW stats_real_action_log AS
  SELECT * FROM action_log
   WHERE traffic IS NULL
     AND (user_id IS NULL OR user_id NOT IN (SELECT user_id FROM stats_excluded_users))
     AND (install_id IS NULL OR install_id NOT IN (SELECT install_id FROM stats_excluded_installs));

-- An install (app install or consented web id) is excluded once it has acted as a
-- team / test / review account at all: a refused attempt on a team account from a
-- device nobody tagged still marks that device, and every other row it produced.
CREATE OR REPLACE VIEW stats_excluded_installs AS
  SELECT install_id FROM usage_installs
   WHERE traffic IS NOT NULL OR user_id IN (SELECT user_id FROM stats_excluded_users)
  UNION
  SELECT install_id FROM action_log
   WHERE install_id IS NOT NULL AND user_id IN (SELECT user_id FROM stats_excluded_users)
  UNION
  SELECT install_id FROM usage_events
   WHERE install_id IS NOT NULL AND user_id IN (SELECT user_id FROM stats_excluded_users);

CREATE INDEX IF NOT EXISTS action_log_signin_ts ON action_log (ts) WHERE action = 'signin';

-- Backfill refused password sign-ins from before this column existed: the reason and
-- account were written to security_events in the same request (same second).
WITH matched AS (
  SELECT DISTINCT ON (a.id) a.id, e.event_metadata->>'reason' AS reason, e.user_id
    FROM action_log a
    JOIN security_events e
      ON e.event_type = 'login_failure'
     AND e.event_metadata->>'source' = CASE WHEN a.platform = 'web' THEN 'web' ELSE 'mobile' END
     AND e.created_at BETWEEN a.ts::timestamp - INTERVAL '2 seconds' AND a.ts::timestamp + INTERVAL '2 seconds'
   WHERE a.action = 'signin' AND a.provider = 'password' AND a.outcome <> 'ok' AND a.reason IS NULL
   ORDER BY a.id, abs(extract(epoch FROM (e.created_at - a.ts::timestamp)))
)
UPDATE action_log a
   SET reason  = m.reason,
       user_id = COALESCE(a.user_id, m.user_id)
  FROM matched m
 WHERE a.id = m.id;
