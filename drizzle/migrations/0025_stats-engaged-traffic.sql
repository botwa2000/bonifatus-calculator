-- /admin/stats counts people, not page loads.
--
-- Two new values of the `traffic` column (migration 0024); NULL still means real:
--   bot        crawlers, link previews, headless / automated browsers (user agent
--              or navigator.webdriver, read at request time and never stored)
--   unengaged  anonymous web visitor with no interaction yet; set back to NULL by
--              the first tap, scroll or key (`engage`), a core action or feedback
-- The stats_real_* views already keep only traffic IS NULL, so they need no change.
-- Nothing is deleted: "All traffic" still shows these rows.

CREATE INDEX IF NOT EXISTS usage_events_unengaged_vh  ON usage_events (visitor_hash) WHERE traffic = 'unengaged';
CREATE INDEX IF NOT EXISTS usage_events_unengaged_iid ON usage_events (install_id)   WHERE traffic = 'unengaged';
CREATE INDEX IF NOT EXISTS action_log_unengaged_vh    ON action_log (visitor_hash)   WHERE traffic = 'unengaged';
CREATE INDEX IF NOT EXISTS action_log_unengaged_iid   ON action_log (install_id)     WHERE traffic = 'unengaged';

-- Rows from before `engage` existed: an anonymous web visitor-day counts as a
-- person only with evidence of one: two or more page views (a click), a signed-in
-- request, or a core action other than the passive market_fetch.
WITH engaged AS (
  SELECT COALESCE(install_id, visitor_hash) AS uid, (ts AT TIME ZONE 'UTC')::date AS d
    FROM usage_events WHERE platform = 'web'
   GROUP BY 1, 2
  HAVING COUNT(*) FILTER (WHERE event = 'page_view') >= 2 OR bool_or(user_id IS NOT NULL)
  UNION
  SELECT COALESCE(install_id, visitor_hash), (ts AT TIME ZONE 'UTC')::date
    FROM action_log
   WHERE platform = 'web' AND outcome = 'ok' AND action NOT IN ('bot_check', 'market_fetch')
), events AS (
  UPDATE usage_events e SET traffic = 'unengaged'
   WHERE e.platform = 'web' AND e.traffic IS NULL AND e.user_id IS NULL
     AND COALESCE(e.install_id, e.visitor_hash) IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM engaged x
                      WHERE x.uid = COALESCE(e.install_id, e.visitor_hash)
                        AND x.d = (e.ts AT TIME ZONE 'UTC')::date)
)
UPDATE action_log a SET traffic = 'unengaged'
 WHERE a.platform = 'web' AND a.traffic IS NULL AND a.user_id IS NULL AND a.action <> 'bot_check'
   AND COALESCE(a.install_id, a.visitor_hash) IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM engaged x
                    WHERE x.uid = COALESCE(a.install_id, a.visitor_hash)
                      AND x.d = (a.ts AT TIME ZONE 'UTC')::date);

UPDATE usage_installs i SET traffic = 'unengaged'
 WHERE i.platform = 'web' AND i.traffic IS NULL AND i.user_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM usage_events e
                    WHERE e.install_id = i.install_id AND e.traffic IS NULL);
