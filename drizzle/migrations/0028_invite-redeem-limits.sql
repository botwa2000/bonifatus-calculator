-- Parent → child invites: 7-day codes with redeem limits (lib/connections/redeem-limits.ts).
--
-- security_events.event_type 'invite_redeem_failure': one row per failed redeem attempt.
--   user_id     the child account that tried
--   ip_address  client IP
--   event_metadata: reason (invalid_format | not_found | expired | used | revoked),
--                   source (platform), deviceKey (sha256 of the app install id, when sent),
--                   inviteId (when the code matched a dead invite)
-- 'account_lockout' rows with event_metadata.scope = 'invite_redeem' mark where a lock began.
--
-- Idempotent. ADD VALUE cannot run inside a transaction block on PostgreSQL < 12; run this
-- file on its own (not wrapped in BEGIN/COMMIT).

ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'invite_redeem_failure';

-- The limiter reads the last 24 h of failures per account, IP and device.
CREATE INDEX IF NOT EXISTS security_events_type_created_idx
  ON security_events (event_type, created_at);
