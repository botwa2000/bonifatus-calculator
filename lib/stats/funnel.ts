/**
 * Sign-in, activation and landing-page numbers for /admin/stats.
 *
 * Identity here is the device: an app install, or on the web the consented id or
 * the daily-rotating visitor hash (an unconsented visitor is a new device every
 * UTC day). Accounts are reached through the devices that created or used them,
 * so a sign-up made on the web from a link opened in the app is two devices.
 *
 * The SQL only selects; the shaping (step order, conversion, labels) is pure and
 * unit-tested in funnel.test.ts.
 */
import { int, per, q, type Row, type Tables } from '@/lib/stats/sql'
import { isTrackedPath } from '@/lib/stats/search-console'

/** Device key shared by usage_events and action_log rows. */
const DEV = `COALESCE(install_id, visitor_hash)`

// ── Sign-in denials ──────────────────────────────────────────────────────────
export const SIGNIN_PROVIDERS = ['password', 'google', 'apple'] as const

/** action_log.reason of a refused sign-in (migration 0026) → what the dashboard says. */
export const DENIAL_LABELS: Record<string, string> = {
  wrong_password: 'Wrong password',
  user_not_found: 'No account with this email',
  no_password: 'Account has no password (Google/Apple only)',
  email_unverified: 'Email not confirmed yet',
  rate_limited: 'Too many attempts',
  bad_request: 'Malformed request',
  token_invalid: 'Provider token rejected',
  missing_token: 'No provider token sent',
  no_email: 'Provider gave no email',
  bad_role: 'Invalid role chosen',
  oauth_cancelled: 'Cancelled at Google',
  oauth_callback: 'Google sign-in failed',
  oauth_account_not_linked: 'Google account not linkable',
  oauth_sign_in: 'Google sign-in could not start',
  oauth_profile: 'Google profile unreadable',
  invalid_check: 'Google sign-in expired (state check)',
  server_error: 'Server error',
  unrecorded: 'Not recorded (before reasons were logged)',
}
export const denialLabel = (r: string) => DENIAL_LABELS[r] ?? r.replace(/_/g, ' ')

/** Reason of one refused row: the logged reason, else what the outcome alone tells. */
export const denialReason = (reason: unknown, outcome: unknown) =>
  typeof reason === 'string' && reason
    ? reason
    : outcome === 'rate_limited'
      ? 'rate_limited'
      : outcome === 'fail'
        ? 'server_error'
        : 'unrecorded'

export interface DenialRow {
  day: string
  provider: string
  reason: string | null
  outcome: string
  n: number
}

export function shapeDenials(
  days: string[],
  rows: DenialRow[],
  totals: { provider: string; ok: number; refused: number; people: number; stuck: number }[]
) {
  const byDay = new Map(days.map((d) => [d, { day: d, password: 0, google: 0, apple: 0 }]))
  type ReasonRow = {
    reason: string
    label: string
    total: number
    password: number
    google: number
    apple: number
  }
  const reasons = new Map<string, ReasonRow>()
  for (const r of rows) {
    const provider = (SIGNIN_PROVIDERS as readonly string[]).includes(r.provider)
      ? r.provider
      : 'password'
    const d = byDay.get(r.day)
    if (d) d[provider as 'password'] += r.n
    const reason = denialReason(r.reason, r.outcome)
    let x = reasons.get(reason)
    if (!x) {
      x = { reason, label: denialLabel(reason), total: 0, password: 0, google: 0, apple: 0 }
      reasons.set(reason, x)
    }
    x.total += r.n
    x[provider as 'password'] += r.n
  }
  const providers = SIGNIN_PROVIDERS.map((provider) => {
    const t = totals.find((x) => x.provider === provider)
    const ok = t?.ok ?? 0
    const refused = t?.refused ?? 0
    return {
      provider,
      attempts: ok + refused,
      ok,
      refused,
      refusedShare: ok + refused ? refused / (ok + refused) : null,
      people: t?.people ?? 0,
      stuck: t?.stuck ?? 0,
    }
  })
  return {
    days: [...byDay.values()],
    reasons: [...reasons.values()].sort((a, b) => b.total - a.total),
    providers,
  }
}

async function signinDenials(
  w: { from: Date; to: Date },
  p: string,
  t: Tables,
  days: string[],
  bucket: string
) {
  const args = [w.from, w.to, p, bucket]
  const [rows, totals] = await Promise.all([
    q(
      `SELECT ${per('ts', 4)} AS day, COALESCE(provider, 'password') AS provider, reason, outcome, COUNT(*) AS n
         FROM ${t.action_log}
        WHERE action = 'signin' AND outcome <> 'ok' AND ts >= $1 AND ts < $2 AND ($3 = 'all' OR platform = $3)
        GROUP BY 1, 2, 3, 4`,
      args
    ),
    // people = devices refused at least once; stuck = of those, never signed in
    // successfully afterwards (up to now).
    q(
      `WITH s AS (
         SELECT ${DEV} AS dev, ts, COALESCE(provider, 'password') AS provider, outcome
           FROM ${t.action_log}
          WHERE action = 'signin' AND ts >= $1 AND ts < $2 AND ($3 = 'all' OR platform = $3)
       ), refused AS (
         SELECT provider, dev, MIN(ts) AS first FROM s WHERE outcome <> 'ok' AND dev IS NOT NULL GROUP BY 1, 2
       )
       SELECT s.provider,
              COUNT(*) FILTER (WHERE outcome = 'ok') AS ok,
              COUNT(*) FILTER (WHERE outcome <> 'ok') AS refused,
              (SELECT COUNT(*) FROM refused r WHERE r.provider = s.provider) AS people,
              (SELECT COUNT(*) FROM refused r WHERE r.provider = s.provider AND NOT EXISTS (
                 SELECT 1 FROM ${t.action_log} a
                  WHERE a.action = 'signin' AND a.outcome = 'ok' AND ${DEV.replace(/install_id|visitor_hash/g, 'a.$&')} = r.dev AND a.ts > r.first)) AS stuck
         FROM s GROUP BY 1`,
      args.slice(0, 3)
    ),
  ])
  return shapeDenials(
    days,
    rows.map((r) => ({
      day: String(r.day),
      provider: String(r.provider),
      reason: (r.reason as string) ?? null,
      outcome: String(r.outcome),
      n: int(r.n),
    })),
    totals.map((r) => ({
      provider: String(r.provider),
      ok: int(r.ok),
      refused: int(r.refused),
      people: int(r.people),
      stuck: int(r.stuck),
    }))
  )
}

// ── Activation funnel ────────────────────────────────────────────────────────
export const ACTIVATION_STEPS = [
  { id: 'devices', label: 'Installed / first visit' },
  { id: 'onboarded', label: 'Finished onboarding', appOnly: true },
  { id: 'reg_started', label: 'Started registration' },
  { id: 'created', label: 'Account created' },
  { id: 'verified', label: 'Email confirmed' },
  { id: 'graded', label: 'First grade' },
  { id: 'settled', label: 'First settlement' },
  { id: 'linked', label: 'Family linked' },
] as const
export type StepId = (typeof ACTIVATION_STEPS)[number]['id']
export const ACTIVATION_PLATFORMS = ['web', 'ios', 'android', 'app'] as const

/**
 * One row per platform (+ "all"): the count at each step, the share of the step
 * before (stepRate) and of the first step (overall). Web has no onboarding: its
 * onboarding cell is null and the next step is compared with the first one.
 */
export function shapeActivation(rows: ({ platform: string } & Record<StepId, number>)[]) {
  const sum = (id: StepId, list = rows) => list.reduce((s, r) => s + (r[id] || 0), 0)
  const line = (platform: string, list: typeof rows) => {
    const web = platform === 'web'
    let prev: number | null = null
    const first = sum('devices', list)
    const steps = ACTIVATION_STEPS.map((s) => {
      if (web && 'appOnly' in s) return { id: s.id, n: null, stepRate: null, overall: null }
      const n = sum(s.id, list)
      const out = {
        id: s.id,
        n,
        stepRate: prev == null ? null : prev ? n / prev : null,
        overall: first ? n / first : null,
      }
      prev = n
      return out
    })
    return { platform, steps }
  }
  const present = ACTIVATION_PLATFORMS.filter((p) =>
    rows.some((r) => r.platform === p && r.devices)
  )
  return {
    steps: ACTIVATION_STEPS.map((s) => ({ id: s.id, label: s.label, appOnly: 'appOnly' in s })),
    rows: [
      ...present.map((p) =>
        line(
          p,
          rows.filter((r) => r.platform === p)
        )
      ),
      ...(present.length > 1 ? [line('all', rows)] : []),
    ],
  }
}

async function activation(w: { from: Date; to: Date }, p: string, t: Tables) {
  const rows = await q(
    `WITH seen AS (
       SELECT DISTINCT ${DEV} AS dev FROM ${t.usage_events} WHERE ts >= $1 AND ts < $2 AND ${DEV} IS NOT NULL
       UNION
       SELECT DISTINCT ${DEV} FROM ${t.action_log} WHERE ts >= $1 AND ts < $2 AND ${DEV} IS NOT NULL AND action <> 'bot_check'
     ), r AS (
       SELECT ${DEV} AS dev, ts, platform, user_id, event, screen,
              NULL::text AS action, NULL::text AS provider, NULL::text AS outcome
         FROM ${t.usage_events} WHERE ${DEV} IN (SELECT dev FROM seen)
       UNION ALL
       SELECT ${DEV}, ts, platform, user_id, NULL, NULL, action, provider, outcome
         FROM ${t.action_log} WHERE ${DEV} IN (SELECT dev FROM seen) AND action <> 'bot_check'
     ), d AS (
       SELECT dev, MIN(ts) AS first, (array_agg(platform ORDER BY ts))[1] AS platform,
              bool_or(event = 'screen_view' AND screen NOT IN ('/onboarding', '/splash')) AS past_onboarding,
              bool_or((event = 'screen_view' AND screen = '/auth/register')
                   OR (event = 'page_view' AND screen ~ '^/[a-z]{2}/register/?$')
                   OR event = 'signup_start' OR action = 'signup'
                   OR (action = 'signin' AND provider IN ('google', 'apple'))) AS reg_started,
              -- Accounts this device created or used: a successful sign-up / sign-in,
              -- or any event sent while signed in.
              array_agg(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL
                AND (outcome = 'ok' OR (action IS NULL AND event IS NOT NULL))) AS accounts
         FROM r GROUP BY dev
       HAVING MIN(ts) >= $1 AND MIN(ts) < $2
     ), acct AS (
       -- Only accounts that are new with the device: signing in to an old account on a
       -- new phone is not an activation.
       SELECT d.dev, u.id, (u.email_verified IS NOT NULL) AS verified
         FROM d CROSS JOIN LATERAL unnest(d.accounts) AS a(id)
         JOIN ${t.user_profiles} pr ON pr.id = a.id
         JOIN users u ON u.id = a.id
        WHERE pr.created_at >= d.first - INTERVAL '1 day'
     ), fam AS (
       -- An account and the accounts linked to it (a parent's grades are the child's).
       SELECT a.dev, a.id, a.id AS member FROM acct a
       UNION
       SELECT a.dev, a.id, CASE WHEN r.parent_id = a.id THEN r.child_id ELSE r.parent_id END
         FROM acct a JOIN ${t.parent_child_relationships} r
           ON (r.parent_id = a.id OR r.child_id = a.id) AND r.invitation_status = 'accepted'
     ), per AS (
       SELECT d.platform,
              (d.platform = 'web' OR d.past_onboarding OR d.reg_started
                 OR EXISTS (SELECT 1 FROM acct a WHERE a.dev = d.dev)) AS onboarded,
              (d.reg_started OR EXISTS (SELECT 1 FROM acct a WHERE a.dev = d.dev)) AS reg_started,
              EXISTS (SELECT 1 FROM acct a WHERE a.dev = d.dev) AS created,
              EXISTS (SELECT 1 FROM acct a WHERE a.dev = d.dev AND a.verified) AS verified,
              EXISTS (SELECT 1 FROM fam f WHERE f.dev = d.dev AND (
                        EXISTS (SELECT 1 FROM ${t.quick_grades} g WHERE g.child_id = f.member)
                     OR EXISTS (SELECT 1 FROM ${t.term_grades} g WHERE g.child_id = f.member))) AS graded,
              EXISTS (SELECT 1 FROM acct a JOIN ${t.settlements} s ON s.parent_id = a.id OR s.child_id = a.id
                       WHERE a.dev = d.dev) AS settled,
              EXISTS (SELECT 1 FROM fam f WHERE f.dev = d.dev AND f.member <> f.id) AS linked
         FROM d WHERE ($3 = 'all' OR d.platform = $3)
     )
     SELECT platform, COUNT(*) AS devices,
            COUNT(*) FILTER (WHERE onboarded) AS onboarded,
            COUNT(*) FILTER (WHERE reg_started) AS reg_started,
            COUNT(*) FILTER (WHERE created) AS created,
            COUNT(*) FILTER (WHERE verified) AS verified,
            COUNT(*) FILTER (WHERE graded) AS graded,
            COUNT(*) FILTER (WHERE settled) AS settled,
            COUNT(*) FILTER (WHERE linked) AS linked
       FROM per GROUP BY 1`,
    [w.from, w.to, p]
  )
  return shapeActivation(
    rows.map((r: Row) => ({
      platform: String(r.platform),
      ...(Object.fromEntries(ACTIVATION_STEPS.map((s) => [s.id, int(r[s.id])])) as Record<
        StepId,
        number
      >),
    }))
  )
}

// ── Landing pages → sign-up ──────────────────────────────────────────────────
/** Entry path as reported: no trailing slash (except "/"), no query (cleanScreen). */
export const entryPath = (s: string) => (s.length > 1 ? s.replace(/\/+$/, '') : s)

async function landingPages(w: { from: Date; to: Date }, p: string, t: Tables) {
  if (p !== 'all' && p !== 'web') return { rows: [], visits: 0, tracked: trackedLandingTotal([]) }
  // A visit = one device on one UTC day; its entry page is the first page view.
  // Started = opened the register page later that day, or began a sign-up or a
  // Google sign-in. Created = a new account that day: a successful sign-up or new
  // Google account from the same device key, or (consented visitors, whose page
  // views and requests carry different keys) a page view signed in to an account
  // created that day.
  const rows = await q(
    `WITH pv AS (
       SELECT ${DEV} AS dev, (ts AT TIME ZONE 'UTC')::date AS d, ts, screen, user_id
         FROM ${t.usage_events}
        WHERE platform = 'web' AND event = 'page_view' AND ts >= $1 AND ts < $2 AND ${DEV} IS NOT NULL
     ), entry AS (
       SELECT DISTINCT ON (dev, d) dev, d, ts, screen FROM pv ORDER BY dev, d, ts
     ), act AS (
       SELECT ${DEV} AS dev, (ts AT TIME ZONE 'UTC')::date AS d, ts, action, provider, outcome, reason
         FROM ${t.action_log}
        WHERE platform = 'web' AND ts >= $1 AND ts < $2 AND ${DEV} IS NOT NULL
          AND (action = 'signup' OR (action = 'signin' AND provider = 'google'))
     )
     SELECT e.screen, COUNT(*) AS visits,
            COUNT(*) FILTER (WHERE
                 EXISTS (SELECT 1 FROM pv WHERE pv.dev = e.dev AND pv.d = e.d AND pv.ts >= e.ts
                           AND pv.screen ~ '^/[a-z]{2}/register/?$')
              OR EXISTS (SELECT 1 FROM act a WHERE a.dev = e.dev AND a.d = e.d AND a.ts >= e.ts)) AS started,
            COUNT(*) FILTER (WHERE
                 EXISTS (SELECT 1 FROM act a WHERE a.dev = e.dev AND a.d = e.d AND a.ts >= e.ts AND a.outcome = 'ok'
                           AND (a.action = 'signup' OR a.reason = 'new_account'))
              OR EXISTS (SELECT 1 FROM pv JOIN ${t.user_profiles} pr ON pr.id = pv.user_id
                          WHERE pv.dev = e.dev AND pv.d = e.d AND pv.ts >= e.ts
                            AND (pr.created_at AT TIME ZONE 'UTC')::date = e.d)) AS created
       FROM entry e GROUP BY 1 ORDER BY visits DESC, started DESC LIMIT 200`,
    [w.from, w.to]
  )
  // Merge "/de/x" and "/de/x/" after the fact (cheaper than in SQL), then rank.
  const m = new Map<string, { page: string; visits: number; started: number; created: number }>()
  for (const r of rows) {
    const page = entryPath(String(r.screen ?? ''))
    if (!page) continue
    const x = m.get(page) ?? { page, visits: 0, started: 0, created: 0 }
    x.visits += int(r.visits)
    x.started += int(r.started)
    x.created += int(r.created)
    m.set(page, x)
  }
  const list = [...m.values()].sort((a, b) => b.visits - a.visits || b.started - a.started)
  return {
    rows: list.slice(0, 40),
    visits: list.reduce((s, r) => s + r.visits, 0),
    tracked: trackedLandingTotal(list),
  }
}

/** "/de/ratgeber/x" → "/ratgeber/x"; "/de" → "/". */
const stripLocale = (page: string) => page.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'

/** Visits that landed on a Ratgeber page or one of its calculators, summed (growth plan B5). */
export function trackedLandingTotal(
  rows: Array<{ page: string; visits: number; started: number; created: number }>
) {
  const t = { visits: 0, started: 0, created: 0 }
  for (const r of rows) {
    if (!isTrackedPath(stripLocale(r.page))) continue
    t.visits += r.visits
    t.started += r.started
    t.created += r.created
  }
  return t
}

export async function funnels(
  w: { from: Date; to: Date },
  p: string,
  t: Tables,
  days: string[],
  bucket: string
) {
  const [denials, act, landing] = await Promise.all([
    signinDenials(w, p, t, days, bucket),
    activation(w, p, t),
    landingPages(w, p, t),
  ])
  return { denials, activation: act, landing }
}
