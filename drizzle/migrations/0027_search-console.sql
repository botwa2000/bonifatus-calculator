-- /admin/stats: Google Search Console, imported nightly by lib/stats/search-console.ts
-- (read-only API, scope webmasters.readonly). Public search data about our own pages:
-- no user is identified anywhere in it. Idempotent.

-- Search performance per page and day (Search Analytics API, dimension page + date).
CREATE TABLE IF NOT EXISTS gsc_pages (
  day          DATE    NOT NULL,
  page         TEXT    NOT NULL,              -- absolute URL as Google reports it
  clicks       INTEGER NOT NULL,
  impressions  INTEGER NOT NULL,
  position_sum NUMERIC NOT NULL,              -- avg position × impressions, so periods add up
  PRIMARY KEY (day, page)
);
CREATE INDEX IF NOT EXISTS gsc_pages_page_idx ON gsc_pages (page);

-- Latest index status of each tracked page (URL Inspection API).
CREATE TABLE IF NOT EXISTS gsc_index (
  page          TEXT        PRIMARY KEY,
  checked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verdict       TEXT,                         -- PASS | NEUTRAL | FAIL | ...
  coverage      TEXT,                         -- e.g. "Submitted and indexed"
  last_crawl    TIMESTAMPTZ
);
