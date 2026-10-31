-- One-time sign-in links for /admin/stats (lib/stats/admin-auth.ts).
-- Minted only with the server-side STATS_ADMIN_KEY; only the SHA-256 of the
-- token is stored, it expires after 10 minutes and works exactly once.
CREATE TABLE IF NOT EXISTS stats_login_links (
  token_hash TEXT        PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);
