/**
 * Zeugnis-Erinnerung (growth plan B8): double opt-in sign-up, two mails per Land, one-click
 * unsubscribe. Table: migration 0029 (zeugnis_reminders). Mails: ./emails.ts.
 *
 * Personal data is the address and the Land, nothing else; a row is deleted on unsubscribe,
 * after its last mail, or when unconfirmed after 72 hours. Per-page counts for /admin/stats
 * go to action_log (source = the page, never the address).
 */
import crypto from 'node:crypto'
import { pool } from '@/lib/db/client'
import { sendEmail } from '@/lib/email/service'
import { SITE_URL } from '@/lib/site'
import { getLandPage } from '@/content/ratgeber/laender'
import {
  LAND_REMINDERS,
  REMINDER_SEASON,
  getLandReminder,
  germanDay,
  reminderOpen,
  reminderSchedule,
  type LandReminder,
} from '@/content/ratgeber/laender/reminder'
import { confirmMail, dayMail, preMail } from './emails'

export const CONFIRM_TTL_HOURS = 72
/** A second opt-in mail for the same address and Land only after this pause … */
export const RESEND_PAUSE_MS = 10 * 60_000
/** … and never more than this many in total. */
export const MAX_CONFIRM_SENDS = 3
/** A mail that could not be sent is retried until this long after it was due, then dropped. */
const GIVE_UP_MS = 2 * 24 * 3600_000

/** 'overview' (the Halbjahreszeugnis article) or the Land slug of the page the form was on. */
export type SourcePage = string

export function isSourcePage(v: unknown): v is SourcePage {
  return v === 'overview' || (typeof v === 'string' && Boolean(getLandReminder(v)))
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Lower-cased and trimmed, or null if it cannot be an address. */
export function normalizeEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const e = v.trim().toLowerCase()
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null
}

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET is not set')
  return s
}

/**
 * Link tokens are derived from the row id (HMAC), so none is stored and every mail for a
 * sign-up carries the same working link: if the mail server accepts an opt-in mail but the
 * connection then times out, the retry sends the same link again instead of a new one.
 */
type Purpose = 'confirm' | 'unsub'

export function linkToken(purpose: Purpose, id: string): string {
  return crypto
    .createHmac('sha256', secret())
    .update(`zeugnis-${purpose}:${id}`)
    .digest('base64url')
}

export function validLinkToken(purpose: Purpose, id: string, token: unknown): boolean {
  if (typeof token !== 'string' || !token) return false
  const a = Buffer.from(linkToken(purpose, id))
  const b = Buffer.from(token)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v)

function unsubscribeUrls(id: string) {
  const qs = `id=${id}&t=${linkToken('unsub', id)}`
  return {
    unsubscribeUrl: `${SITE_URL}/de/zeugnis-erinnerung/abmelden?${qs}`,
    unsubscribeApiUrl: `${SITE_URL}/api/zeugnis-erinnerung/abmelden?${qs}`,
  }
}

const landName = (slug: string) => getLandPage(slug)?.name ?? slug

/** What the form shows: "Wir schreiben Ihnen am … und …". */
export function reminderPlan(r: LandReminder) {
  const s = reminderSchedule(r)
  return { preDay: germanDay(s.pre), dayDay: germanDay(s.day), when: r.when }
}

export type SubscribeResult =
  /** Opt-in mail sent, or nothing to do; the caller answers the same either way. */
  { status: 'ok'; mailed: boolean } | { status: 'closed' } | { status: 'mail_failed' }

/**
 * Starts (or repeats) the double opt-in for an address and a Land. The answer does not say
 * whether the address was already signed up: an existing, confirmed sign-up gets no mail.
 */
export async function subscribe(
  email: string,
  land: LandReminder,
  sourcePage: SourcePage,
  now: Date = new Date()
): Promise<SubscribeResult> {
  if (!reminderOpen(land, now)) return { status: 'closed' }

  // Insert, or count a repeat on an unconfirmed row whose last opt-in mail is old enough
  // and under the cap. A confirmed row is left alone (no row returned → no mail).
  const { rows } = await pool.query(
    `INSERT INTO zeugnis_reminders (email, land, season, source_page)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email, land, season) DO UPDATE SET
       source_page     = EXCLUDED.source_page,
       confirm_sent_at = NOW(),
       confirm_sends   = zeugnis_reminders.confirm_sends + 1
     WHERE zeugnis_reminders.confirmed_at IS NULL
       AND zeugnis_reminders.confirm_sent_at < NOW() - make_interval(secs => $5)
       AND zeugnis_reminders.confirm_sends < $6
     RETURNING id`,
    [email, land.slug, REMINDER_SEASON, sourcePage, RESEND_PAUSE_MS / 1000, MAX_CONFIRM_SENDS]
  )
  if (!rows.length) return { status: 'ok', mailed: false }
  const id: string = rows[0].id

  const plan = reminderPlan(land)
  const mail = confirmMail({
    landName: landName(land.slug),
    confirmUrl: `${SITE_URL}/de/zeugnis-erinnerung/bestaetigen?id=${id}&t=${linkToken('confirm', id)}`,
    preDay: plan.preDay,
    when: plan.when,
  })
  const sent = await sendEmail({ to: email, ...mail })
  if (!sent) {
    // The mail may still have arrived (a timeout after the server accepted it), so the row
    // stays and its link keeps working. Lift the pause so the person can try again now;
    // an unconfirmed row is deleted after 72 hours anyway.
    await pool.query(
      `UPDATE zeugnis_reminders SET confirm_sent_at = NOW() - make_interval(secs => $2)
        WHERE id = $1 AND confirmed_at IS NULL`,
      [id, RESEND_PAUSE_MS / 1000]
    )
    return { status: 'mail_failed' }
  }
  return { status: 'ok', mailed: true }
}

export type ConfirmResult =
  | { status: 'confirmed' | 'already'; land: string; landName: string; sourcePage: string }
  | { status: 'invalid' }

export async function confirm(id: unknown, token: unknown): Promise<ConfirmResult> {
  if (!isUuid(id) || !validLinkToken('confirm', id, token)) return { status: 'invalid' }
  const { rows } = await pool.query(
    `WITH hit AS (
       SELECT id, confirmed_at FROM zeugnis_reminders
        WHERE id = $1
          AND (confirmed_at IS NOT NULL OR created_at > NOW() - make_interval(hours => $2))
     )
     UPDATE zeugnis_reminders z SET confirmed_at = COALESCE(z.confirmed_at, NOW())
       FROM hit WHERE z.id = hit.id
     RETURNING z.land, z.source_page, hit.confirmed_at AS was_confirmed`,
    [id, CONFIRM_TTL_HOURS]
  )
  if (!rows.length) return { status: 'invalid' }
  const r = rows[0]
  return {
    status: r.was_confirmed ? 'already' : 'confirmed',
    land: r.land,
    landName: landName(r.land),
    sourcePage: r.source_page,
  }
}

export type UnsubscribeResult =
  | { status: 'removed'; land: string; sourcePage: string; confirmed: boolean }
  | { status: 'gone' }
  | { status: 'invalid' }

/** Deletes the sign-up. "gone" (already removed or finished) reads the same to the person. */
export async function unsubscribe(id: unknown, token: unknown): Promise<UnsubscribeResult> {
  if (!isUuid(id) || !validLinkToken('unsub', id, token)) return { status: 'invalid' }
  const { rows } = await pool.query(
    `DELETE FROM zeugnis_reminders WHERE id = $1
     RETURNING land, source_page, confirmed_at IS NOT NULL AS confirmed`,
    [id]
  )
  if (!rows.length) return { status: 'gone' }
  return {
    status: 'removed',
    land: rows[0].land,
    sourcePage: rows[0].source_page,
    confirmed: rows[0].confirmed,
  }
}

// ── Sending ──────────────────────────────────────────────────────────────────

type Which = 'pre' | 'day'

function logMail(land: string, which: Which, ok: boolean) {
  pool
    .query(
      `INSERT INTO action_log (platform, action, source, outcome, status_code, result_id)
       VALUES ('web', 'reminder_mail', $1, $2, $3, $4)`,
      [land, ok ? 'ok' : 'fail', ok ? 200 : 500, which]
    )
    .catch((e) => console.error('[zeugnis-reminder] log:', (e as Error).message))
}

/**
 * Sends one kind of mail to every confirmed row of a Land that has not had it. Each row is
 * claimed by an UPDATE first, so a mail never goes out twice, even with two server processes.
 */
async function sendDue(r: LandReminder, which: Which): Promise<number> {
  const col = which === 'pre' ? 'pre_sent_at' : 'day_sent_at'
  const { rows } = await pool.query(
    `SELECT id, email FROM zeugnis_reminders
      WHERE season = $1 AND land = $2 AND confirmed_at IS NOT NULL AND ${col} IS NULL`,
    [REMINDER_SEASON, r.slug]
  )
  let sent = 0
  for (const row of rows) {
    const claim = await pool.query(
      `UPDATE zeugnis_reminders SET ${col} = NOW() WHERE id = $1 AND ${col} IS NULL RETURNING id`,
      [row.id]
    )
    if (!claim.rowCount) continue
    const name = landName(r.slug)
    const urls = unsubscribeUrls(row.id)
    const mail =
      which === 'pre'
        ? preMail({ landName: name, when: r.when, ...urls })
        : dayMail({ landName: name, when: r.when, kind: r.kind, usually: r.usually, ...urls })
    const ok = await sendEmail({ to: row.email, ...mail })
    logMail(r.slug, which, ok)
    if (ok) {
      sent++
      // The last mail is out: nothing left to keep.
      if (which === 'day') await pool.query(`DELETE FROM zeugnis_reminders WHERE id = $1`, [row.id])
    } else {
      // Release the claim; the next run retries.
      await pool.query(`UPDATE zeugnis_reminders SET ${col} = NULL WHERE id = $1`, [row.id])
    }
  }
  return sent
}

/** One pass: due mails for every Land, then the clean-up. Safe to run as often as wanted. */
export async function runZeugnisReminders(now: Date = new Date()): Promise<void> {
  for (const r of LAND_REMINDERS) {
    const s = reminderSchedule(r)
    if (now >= s.day) {
      if (now.getTime() - s.day.getTime() < GIVE_UP_MS) {
        // Signed up inside the last week but the first mail never went out: the day mail
        // covers it; mark it so it is not sent after the day.
        await pool.query(
          `UPDATE zeugnis_reminders SET pre_sent_at = COALESCE(pre_sent_at, NOW())
            WHERE season = $1 AND land = $2 AND confirmed_at IS NOT NULL`,
          [REMINDER_SEASON, r.slug]
        )
        const n = await sendDue(r, 'day')
        if (n) console.log(`[zeugnis-reminder] ${r.slug}: ${n} day mails`)
      }
    } else if (now >= s.pre) {
      const n = await sendDue(r, 'pre')
      if (n) console.log(`[zeugnis-reminder] ${r.slug}: ${n} pre mails`)
    }
  }
  await purge(now)
}

/** Unconfirmed after 72 h, or a Land whose day is past the retry window: delete. */
async function purge(now: Date) {
  await pool.query(
    `DELETE FROM zeugnis_reminders
      WHERE confirmed_at IS NULL AND created_at < NOW() - make_interval(hours => $1)`,
    [CONFIRM_TTL_HOURS]
  )
  const finished = LAND_REMINDERS.filter(
    (r) => now.getTime() - reminderSchedule(r).day.getTime() >= GIVE_UP_MS
  ).map((r) => r.slug)
  if (finished.length) {
    await pool.query(`DELETE FROM zeugnis_reminders WHERE season = $1 AND land = ANY($2)`, [
      REMINDER_SEASON,
      finished,
    ])
  }
  // Older seasons never carry over.
  await pool.query(`DELETE FROM zeugnis_reminders WHERE season <> $1`, [REMINDER_SEASON])
}

/** Every 10 minutes from server start (instrumentation.ts). */
export function startZeugnisReminders() {
  const run = () =>
    runZeugnisReminders().catch((e) =>
      console.error('[zeugnis-reminder] run failed:', (e as Error).message)
    )
  setTimeout(run, 60_000).unref()
  setInterval(run, 10 * 60_000).unref()
}
