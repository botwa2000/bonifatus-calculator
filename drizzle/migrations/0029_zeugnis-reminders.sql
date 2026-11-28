-- Zeugnis-Erinnerung (growth plan B8): two e-mails per sign-up, one week before the
-- Halbjahreszeugnis of the chosen Land and on the day itself. lib/reminders/zeugnis.ts.
--
-- Data minimisation: the address and the Land are the only personal data. The other
-- columns are what double opt-in needs (proof of the consent: when it was asked for and
-- when it was given) and what keeps a mail from going out twice. No IP address, no name.
-- Confirm and unsubscribe links are HMACs of the id, so no token is stored.
-- A row is deleted on unsubscribe, after its last mail, or when unconfirmed after 72 h;
-- the counts in /admin/stats come from action_log, which never holds the address.
-- Idempotent.

CREATE TABLE IF NOT EXISTS zeugnis_reminders (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT        NOT NULL,              -- lower-cased, trimmed
  land               TEXT        NOT NULL,              -- slug, content/ratgeber/laender
  season             TEXT        NOT NULL,              -- e.g. '2027-halbjahr'
  source_page        TEXT        NOT NULL,              -- 'overview' or the Land slug of the page
  confirm_sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirm_sends      SMALLINT    NOT NULL DEFAULT 1,    -- opt-in mails sent (resend cap)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at       TIMESTAMPTZ,
  pre_sent_at        TIMESTAMPTZ,                       -- one week before
  day_sent_at        TIMESTAMPTZ,                       -- on the day
  UNIQUE (email, land, season)
);
CREATE INDEX IF NOT EXISTS zeugnis_reminders_due_idx
  ON zeugnis_reminders (season, land) WHERE confirmed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS zeugnis_reminders_unconfirmed_idx
  ON zeugnis_reminders (created_at) WHERE confirmed_at IS NULL;
