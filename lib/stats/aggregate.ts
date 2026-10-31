/**
 * Aggregations behind GET /api/admin/usage-stats (rendered by lib/stats/render.ts).
 * All days are UTC. `platform` filters every tracked section: all | web | ios | android.
 * "app" rows are native requests from builds that predate the X-Platform header.
 *
 * Two kinds of numbers:
 *   • tracked  — usage_events / action_log / usage_installs (since tracking went live)
 *   • records  — the product tables themselves (accounts, grades, settlements,
 *     connections). These are the ground truth for all time, but they carry no
 *     platform, so the "Accounts & data" section ignores the platform filter.
 *
 * `traffic` = real (default) reads the stats_real_* views (migration 0024):
 * store review and test devices, the team's own browsers and the accounts in
 * stats_account_class are left out. `traffic` = all reads the raw tables.
 * Store numbers (downloads, ratings) come from the stores and are never filtered.
 */
import { pool } from '@/lib/db/client'
import { autoClassify, listClassified } from '@/lib/stats/classify'

export const RANGES = [
  'today',
  'yesterday',
  '7d',
  '30d',
  '90d',
  'mtd',
  'ytd',
  '12m',
  'custom',
] as const
export const PLATFORMS = ['all', 'web', 'ios', 'android'] as const
export const BUCKETS = ['day', 'week', 'month'] as const
type Range = (typeof RANGES)[number]
type Bucket = (typeof BUCKETS)[number]

const DAY = 86_400_000
const MAX_DAYS = 400 // raw usage rows are kept 13 months

interface Window {
  days: number
  from: Date
  to: Date // exclusive
  prevFrom: Date // the equally long period right before
}

const utcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
const parseDay = (s: unknown) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s))
    ? new Date(`${s}T00:00:00Z`)
    : null

/** UTC day window for a preset, or for custom from/to (inclusive days). */
export function rangeWindow(
  range: string,
  fromDay?: unknown,
  toDay?: unknown,
  now = new Date()
): Window {
  const today = utcDay(now)
  const tomorrow = new Date(today.getTime() + DAY)
  let from: Date
  let to = tomorrow
  switch (range as Range) {
    case 'today':
      from = today
      break
    case 'yesterday':
      from = new Date(today.getTime() - DAY)
      to = today
      break
    case '30d':
      from = new Date(today.getTime() - 29 * DAY)
      break
    case '90d':
      from = new Date(today.getTime() - 89 * DAY)
      break
    case 'mtd':
      from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
      break
    case 'ytd':
      from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1))
      break
    case '12m':
      from = new Date(today.getTime() - 364 * DAY)
      break
    case 'custom': {
      const a = parseDay(fromDay)
      const b = parseDay(toDay)
      if (a && b) {
        const [lo, hi] = a <= b ? [a, b] : [b, a]
        to = new Date(Math.min(hi.getTime() + DAY, tomorrow.getTime()))
        from = new Date(Math.max(lo.getTime(), to.getTime() - MAX_DAYS * DAY))
        if (from >= to) from = new Date(to.getTime() - DAY)
        break
      }
      from = new Date(today.getTime() - 6 * DAY)
      break
    }
    default:
      from = new Date(today.getTime() - 6 * DAY)
  }
  const days = Math.round((to.getTime() - from.getTime()) / DAY)
  return { days, from, to, prevFrom: new Date(from.getTime() - days * DAY) }
}

// Real users only (views from migration 0024) or every row (raw tables).
const TABLE_NAMES = [
  'usage_events',
  'action_log',
  'usage_installs',
  'feedback',
  'user_profiles',
  'quick_grades',
  'term_grades',
  'subject_grades',
  'settlements',
  'parent_child_relationships',
  'parent_child_invites',
] as const
type Tables = Record<(typeof TABLE_NAMES)[number], string>
const tablesFor = (traffic: 'real' | 'all') =>
  Object.fromEntries(
    TABLE_NAMES.map((n) => [n, traffic === 'real' ? `stats_real_${n}` : n])
  ) as Tables

const int = (v: unknown) => Number(v || 0)
const q = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
  (await pool.query(text, params)).rows as T[]
type Row = Record<string, unknown>

const P = `($3 = 'all' OR platform = $3)`
// One person = one id: the account when known — also for that account's
// devices before sign-in (usage_installs.user_id) — else install, else visitor hash.
const uid = (t: string) =>
  `COALESCE(${t}.user_id, (SELECT i.user_id FROM usage_installs i WHERE i.install_id = ${t}.install_id), ${t}.install_id, ${t}.visitor_hash)`

// Union of every row that proves a person was active.
const activity = (t: Tables) => `
  SELECT ts, platform, country, lang, ${uid('e')} AS uid FROM ${t.usage_events} e WHERE ts >= $1 AND ts < $2 AND ${P}
  UNION ALL
  SELECT ts, platform, country, lang, ${uid('a')} AS uid FROM ${t.action_log} a WHERE ts >= $1 AND ts < $2 AND ${P}
    AND action <> 'bot_check'`

// Core actions shown on the dashboard (bot_check is health-only).
const CORE = `action <> 'bot_check'`

function dayList(w: Window): string[] {
  const days: string[] = []
  for (let d = new Date(w.from); d < w.to; d = new Date(d.getTime() + 86_400_000))
    days.push(d.toISOString().slice(0, 10))
  return days
}

function fold(days: string[], rows: Row[], key: string, by = 'platform') {
  const m: Record<string, Record<string, number>> = {}
  for (const r of rows) (m[r.day as string] ||= {})[r[by] as string] = int(r[key])
  return days.map((day) => ({ day, ...(m[day] || {}) }))
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
async function kpis(w: Window, p: string, t: Tables) {
  const one = async (from: Date, to: Date) => {
    const [act, actions, inst, accounts, grades, settled, families] = await Promise.all([
      // Unconsented web visitors rotate their hash daily, so a multi-day distinct
      // count is "visitor-days" for them; accounts and installs count once.
      q(
        `SELECT COUNT(DISTINCT uid) AS users,
                COUNT(DISTINCT (uid, (ts AT TIME ZONE 'UTC')::date)) AS user_days
           FROM (${activity(t)}) a WHERE uid IS NOT NULL`,
        [from, to, p]
      ),
      q(
        `SELECT COUNT(*) FILTER (WHERE outcome = 'ok') AS ok,
                COUNT(*) FILTER (WHERE outcome = 'fail') AS fail,
                COUNT(*) AS n
           FROM ${t.action_log} WHERE ts >= $1 AND ts < $2 AND ${P} AND ${CORE}`,
        [from, to, p]
      ),
      q(
        `SELECT COUNT(*) AS n FROM ${t.usage_installs}
          WHERE first_seen >= $1 AND first_seen < $2 AND ${P}`,
        [from, to, p]
      ),
      q(
        `SELECT COUNT(*) AS n,
                COUNT(*) FILTER (WHERE role = 'parent') AS parents,
                COUNT(*) FILTER (WHERE role = 'child') AS children
           FROM ${t.user_profiles} WHERE created_at >= $1 AND created_at < $2 AND role <> 'admin'`,
        [from, to]
      ),
      q(
        `SELECT (SELECT COUNT(*) FROM ${t.quick_grades} WHERE created_at >= $1 AND created_at < $2) AS quick,
                (SELECT COUNT(*) FROM ${t.term_grades}  WHERE created_at >= $1 AND created_at < $2) AS terms`,
        [from, to]
      ),
      q(
        `SELECT currency, COUNT(*) AS n, SUM(amount)::float AS amount
           FROM ${t.settlements} WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 2 DESC`,
        [from, to]
      ),
      q(
        `SELECT COUNT(*) AS n FROM ${t.parent_child_relationships}
          WHERE invitation_status = 'accepted' AND created_at >= $1 AND created_at < $2`,
        [from, to]
      ),
    ])
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000))
    return {
      activeUsers: int(act[0].users),
      avgDailyUsers: Math.round((10 * int(act[0].user_days)) / days) / 10,
      newInstalls: int(inst[0].n),
      newAccounts: int(accounts[0].n),
      newParents: int(accounts[0].parents),
      newChildren: int(accounts[0].children),
      quickGrades: int(grades[0].quick),
      termGrades: int(grades[0].terms),
      settlements: settled.reduce((a, r) => a + int(r.n), 0),
      settledByCurrency: settled.map((r) => ({
        currency: r.currency as string,
        n: int(r.n),
        amount: Number(r.amount || 0),
      })),
      newConnections: int(families[0].n),
      actions: int(actions[0].n),
      actionsOk: int(actions[0].ok),
      actionsFailed: int(actions[0].fail),
    }
  }
  const [cur, prev] = await Promise.all([one(w.from, w.to), one(w.prevFrom, w.from)])
  return { cur, prev }
}

// ── Accounts & data (product tables, all platforms, all time) ───────────────
async function records(w: Window, t: Tables) {
  const days = dayList(w)
  const [totals, signups, gradesPerDay, settlePerDay, activation, systems] = await Promise.all([
    q(
      `SELECT
         (SELECT COUNT(*) FROM ${t.user_profiles} WHERE role <> 'admin') AS accounts,
         (SELECT COUNT(*) FROM ${t.user_profiles} WHERE role = 'parent') AS parents,
         (SELECT COUNT(*) FROM ${t.user_profiles} WHERE role = 'child') AS children,
         (SELECT COUNT(*) FROM users u JOIN ${t.user_profiles} p ON p.id = u.id
            WHERE u.email_verified IS NULL AND p.role <> 'admin') AS unverified,
         (SELECT COUNT(*) FROM ${t.user_profiles} WHERE role <> 'admin' AND (is_active = false OR deleted_at IS NOT NULL)) AS inactive,
         (SELECT COUNT(*) FROM ${t.parent_child_relationships} WHERE invitation_status = 'accepted') AS connections,
         (SELECT COUNT(DISTINCT parent_id) FROM ${t.parent_child_relationships} WHERE invitation_status = 'accepted') AS families,
         (SELECT COUNT(*) FROM ${t.quick_grades}) AS quick_grades,
         (SELECT COUNT(*) FROM ${t.term_grades}) AS term_grades,
         (SELECT COUNT(*) FROM ${t.subject_grades}) AS subject_grades,
         (SELECT COUNT(*) FROM ${t.settlements}) AS settlements,
         (SELECT COUNT(DISTINCT child_id) FROM (
            SELECT child_id FROM ${t.quick_grades} UNION SELECT child_id FROM ${t.term_grades}) g) AS children_with_grades`
    ),
    q(
      `SELECT (created_at AT TIME ZONE 'UTC')::date::text AS day, role, COUNT(*) AS n
         FROM ${t.user_profiles} WHERE created_at >= $1 AND created_at < $2 AND role <> 'admin'
        GROUP BY 1, 2 ORDER BY 1`,
      [w.from, w.to]
    ),
    q(
      `SELECT day, kind, COUNT(*) AS n FROM (
         SELECT (created_at AT TIME ZONE 'UTC')::date::text AS day, 'quick' AS kind FROM ${t.quick_grades}
          WHERE created_at >= $1 AND created_at < $2
         UNION ALL
         SELECT (created_at AT TIME ZONE 'UTC')::date::text, 'term' FROM ${t.term_grades}
          WHERE created_at >= $1 AND created_at < $2) g
        GROUP BY 1, 2 ORDER BY 1`,
      [w.from, w.to]
    ),
    q(
      `SELECT (created_at AT TIME ZONE 'UTC')::date::text AS day, 'settlement' AS kind, COUNT(*) AS n
         FROM ${t.settlements} WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 1`,
      [w.from, w.to]
    ),
    // Activation: accounts created in range that have a grade / a family link.
    q(
      `SELECT COUNT(*) AS signups,
              COUNT(*) FILTER (WHERE p.role = 'child' AND (
                EXISTS (SELECT 1 FROM ${t.quick_grades} g WHERE g.child_id = p.id) OR
                EXISTS (SELECT 1 FROM ${t.term_grades} t WHERE t.child_id = p.id))) AS children_graded,
              COUNT(*) FILTER (WHERE p.role = 'child') AS children,
              COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM ${t.parent_child_relationships} r
                 WHERE r.invitation_status = 'accepted' AND (r.parent_id = p.id OR r.child_id = p.id))) AS connected
         FROM ${t.user_profiles} p WHERE p.created_at >= $1 AND p.created_at < $2 AND p.role <> 'admin'`,
      [w.from, w.to]
    ),
    q(
      `SELECT COALESCE(gs.name->>'en', gs.code) AS system, COUNT(*) AS n FROM (
         SELECT grading_system_id FROM ${t.quick_grades} WHERE created_at >= $1 AND created_at < $2
         UNION ALL
         SELECT grading_system_id FROM ${t.term_grades} WHERE created_at >= $1 AND created_at < $2) g
         JOIN grading_systems gs ON gs.id = g.grading_system_id
        GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
      [w.from, w.to]
    ),
  ])
  const tot = totals[0]
  const a = activation[0]
  return {
    totals: Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, int(v)])),
    signupsPerDay: fold(days, signups, 'n', 'role'),
    gradesPerDay: fold(days, gradesPerDay, 'n', 'kind'),
    settlementsPerDay: fold(days, settlePerDay, 'n', 'kind'),
    activation: {
      signups: int(a.signups),
      children: int(a.children),
      childrenGraded: int(a.children_graded),
      connected: int(a.connected),
    },
    gradingSystems: systems.map((r) => ({ system: r.system as string, n: int(r.n) })),
  }
}

// ── Store ratings & downloads ────────────────────────────────────────────────
async function store(w: Window, p: string, t: Tables) {
  const plats = p === 'all' ? ['ios', 'android'] : p === 'web' ? [] : [p]
  if (!plats.length) return { downloads: {}, prevDownloads: {}, reviews: null }
  const [dl, latest, written, recent, hist, writtenHist, replied, trend, base, countries] =
    await Promise.all([
      q(
        `SELECT platform,
                SUM(value) FILTER (WHERE day >= $1::date) AS cur,
                SUM(value) FILTER (WHERE day <  $1::date) AS prev
           FROM store_daily WHERE metric = 'downloads' AND day >= $2::date AND day < $3::date AND platform = ANY($4)
          GROUP BY platform`,
        [w.from, w.prevFrom, w.to, plats]
      ),
      q(
        `SELECT DISTINCT ON (platform, metric) platform, metric, value
           FROM store_daily WHERE metric IN ('rating_count_total', 'rating_avg_total', 'installs_total', 'active_devices')
            AND platform = ANY($1)
          ORDER BY platform, metric, day DESC`,
        [plats]
      ),
      q(
        `SELECT platform, COUNT(*) AS n, AVG(rating)::float AS avg,
                COUNT(*) FILTER (WHERE created_at >= $2) AS n_period
           FROM store_reviews WHERE platform = ANY($1) GROUP BY platform`,
        [plats, w.from]
      ),
      q(
        `SELECT platform, created_at, rating, territory, lang, title, body, app_version, replied
           FROM store_reviews WHERE platform = ANY($1) ORDER BY created_at DESC LIMIT 8`,
        [plats]
      ),
      q(
        `SELECT DISTINCT ON (platform, metric) platform, metric, value FROM store_daily
          WHERE metric LIKE 'hist:%' AND platform = ANY($1) ORDER BY platform, metric, day DESC`,
        [plats]
      ),
      q(
        `SELECT platform, rating, COUNT(*) AS n FROM store_reviews WHERE platform = ANY($1) GROUP BY 1, 2`,
        [plats]
      ),
      q(
        `SELECT platform, COUNT(*) FILTER (WHERE replied) AS replied, COUNT(*) FILTER (WHERE replied IS NOT NULL) AS known
           FROM store_reviews WHERE platform = ANY($1) GROUP BY 1`,
        [plats]
      ),
      q(
        `SELECT day::text, platform, metric, value FROM store_daily
          WHERE metric IN ('rating_count_total', 'rating_avg_total') AND platform = ANY($1)
            AND day >= $2::date AND day < $3::date ORDER BY day`,
        [plats, w.from, w.to]
      ),
      q(
        `SELECT DISTINCT ON (platform, metric) platform, metric, value FROM store_daily
          WHERE metric IN ('rating_count_total', 'rating_avg_total') AND platform = ANY($1) AND day < $2::date
          ORDER BY platform, metric, day DESC`,
        [plats, w.from]
      ),
      q(
        `SELECT substring(metric FROM 12) AS country, value FROM store_daily
          WHERE platform = 'ios' AND metric LIKE 'ratings_cc:%' AND 'ios' = ANY($1)
            AND day = (SELECT MAX(day) FROM store_daily WHERE platform = 'ios' AND metric = 'rating_count_total')`,
        [plats]
      ),
    ])

  const downloads: Record<string, number> = {}
  const prevDownloads: Record<string, number> = {}
  for (const r of dl) {
    downloads[r.platform as string] = int(r.cur)
    prevDownloads[r.platform as string] = int(r.prev)
  }

  interface PerPlatform {
    ratings: number | null
    avg: number | null
    written: number
    writtenAvg: number | null
    writtenPeriod: number
    installsTotal: number | null
    activeDevices: number | null
    histogram: Record<string, number> | null
    histogramSource: string | null
    replied: number
    repliedKnown: number
    ratingsAtStart: number | null
    avgAtStart: number | null
    ratingsIsWrittenOnly?: boolean
  }
  const per: Record<string, PerPlatform> = {}
  for (const pl of plats)
    per[pl] = {
      ratings: null,
      avg: null,
      written: 0,
      writtenAvg: null,
      writtenPeriod: 0,
      installsTotal: null,
      activeDevices: null,
      histogram: null,
      histogramSource: null,
      replied: 0,
      repliedKnown: 0,
      ratingsAtStart: null,
      avgAtStart: null,
    }
  for (const r of hist) {
    const t = per[r.platform as string]
    ;(t.histogram ||= {})[(r.metric as string).slice(5)] = int(r.value)
    t.histogramSource = 'store'
  }
  for (const r of writtenHist) {
    const t = per[r.platform as string]
    if (t.histogramSource === 'store') continue
    ;(t.histogram ||= {})[String(r.rating)] = int(r.n)
    t.histogramSource = 'written reviews'
  }
  for (const r of replied)
    Object.assign(per[r.platform as string], {
      replied: int(r.replied),
      repliedKnown: int(r.known),
    })
  for (const r of base) {
    if (r.metric === 'rating_count_total') per[r.platform as string].ratingsAtStart = int(r.value)
    if (r.metric === 'rating_avg_total') per[r.platform as string].avgAtStart = Number(r.value)
  }
  for (const r of latest) {
    const t = per[r.platform as string]
    if (r.metric === 'rating_count_total') t.ratings = int(r.value)
    if (r.metric === 'rating_avg_total') t.avg = Number(r.value)
    if (r.metric === 'installs_total') t.installsTotal = int(r.value)
    if (r.metric === 'active_devices') t.activeDevices = int(r.value)
  }
  for (const r of written)
    Object.assign(per[r.platform as string], {
      written: int(r.n),
      writtenAvg: r.avg as number,
      writtenPeriod: int(r.n_period),
    })
  // No store total yet (feed not run) → the written-review count is the floor.
  // Play hides its public total until an app has enough ratings, so written
  // reviews can exceed the listing's 0 — the larger number is the honest one.
  for (const t of Object.values(per)) {
    if (t.ratings === null || t.written > t.ratings) {
      t.ratings = t.written
      t.ratingsIsWrittenOnly = true
    }
    if (t.avg === null) t.avg = t.writtenAvg
  }
  const trendByDay: Record<string, Record<string, number | string>> = {}
  for (const r of trend) {
    const d = (trendByDay[r.day as string] ||= { day: r.day as string })
    d[`${r.platform}_${r.metric === 'rating_count_total' ? 'count' : 'avg'}`] = Number(r.value)
  }
  const total = Object.values(per).reduce((a, t) => a + (t.ratings || 0), 0)
  const wsum = Object.values(per).reduce((a, t) => a + (t.ratings || 0) * (t.avg || 0), 0)
  return {
    downloads,
    prevDownloads,
    reviews: {
      total,
      avg: total ? wsum / total : null,
      perPlatform: per,
      recent,
      totalAtStart: Object.values(per).reduce((a, t) => a + (t.ratingsAtStart || 0), 0),
      trend: Object.values(trendByDay),
      iosCountries: countries
        .map((r) => ({ country: r.country as string, n: int(r.value) }))
        .sort((a, b) => b.n - a.n),
    },
  }
}

// ── Daily series ─────────────────────────────────────────────────────────────
async function series(w: Window, p: string, t: Tables) {
  const days = dayList(w)
  const [dau, acts, dl] = await Promise.all([
    q(
      `SELECT (ts AT TIME ZONE 'UTC')::date::text AS day, platform, COUNT(DISTINCT uid) AS n
         FROM (${activity(t)}) a WHERE uid IS NOT NULL GROUP BY 1, 2 ORDER BY 1`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT (ts AT TIME ZONE 'UTC')::date::text AS day, platform,
              COUNT(*) FILTER (WHERE outcome = 'ok') AS ok,
              COUNT(*) FILTER (WHERE outcome = 'fail') AS fail
         FROM ${t.action_log} WHERE ts >= $1 AND ts < $2 AND ${P} AND ${CORE}
        GROUP BY 1, 2 ORDER BY 1`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT day::text, platform, value FROM store_daily
        WHERE metric = 'downloads' AND day >= $1::date AND day < $2::date AND ${P}
        ORDER BY day`,
      [w.from, w.to, p]
    ),
  ])
  const fails: Record<string, number> = {}
  for (const r of acts) fails[r.day as string] = (fails[r.day as string] || 0) + int(r.fail)
  return {
    days,
    activeUsers: fold(days, dau, 'n'),
    actions: fold(days, acts, 'ok').map((x) => ({ ...x, _fail: fails[x.day] || 0 })),
    downloads: fold(days, dl, 'value'),
  }
}

// ── Usage: core actions, screens, pages, events ──────────────────────────────
async function usage(w: Window, p: string, t: Tables) {
  const [core, screens, pages, events] = await Promise.all([
    q(
      `SELECT action, COUNT(*) AS n,
              COUNT(*) FILTER (WHERE outcome = 'ok') AS ok,
              COUNT(*) FILTER (WHERE outcome = 'fail') AS fail,
              COUNT(*) FILTER (WHERE outcome NOT IN ('ok', 'fail')) AS rejected,
              percentile_cont(0.5)  WITHIN GROUP (ORDER BY latency_ms) AS p50,
              percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95,
              COUNT(*) FILTER (WHERE platform = 'web') AS web,
              COUNT(*) FILTER (WHERE platform = 'ios') AS ios,
              COUNT(*) FILTER (WHERE platform = 'android') AS android,
              COUNT(*) FILTER (WHERE platform = 'app') AS app
         FROM ${t.action_log} WHERE ts >= $1 AND ts < $2 AND ${P} AND ${CORE}
        GROUP BY 1 ORDER BY n DESC`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT screen, COUNT(*) AS n, COUNT(DISTINCT ${uid('e')}) AS users
         FROM ${t.usage_events} e WHERE event = 'screen_view' AND ts >= $1 AND ts < $2 AND ${P}
        GROUP BY 1 ORDER BY n DESC LIMIT 20`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT screen, COUNT(*) AS n, COUNT(DISTINCT ${uid('e')}) AS users
         FROM ${t.usage_events} e WHERE event = 'page_view' AND ts >= $1 AND ts < $2 AND ${P}
        GROUP BY 1 ORDER BY n DESC LIMIT 20`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT event, platform, COUNT(*) AS n
         FROM ${t.usage_events} WHERE event NOT IN ('page_view', 'screen_view')
          AND ts >= $1 AND ts < $2 AND ${P}
        GROUP BY 1, 2 ORDER BY 1`,
      [w.from, w.to, p]
    ),
  ])
  const ev: Record<string, Record<string, number>> = {}
  for (const r of events) {
    const e = (ev[r.event as string] ||= { total: 0 })
    e[r.platform as string] = int(r.n)
    e.total += int(r.n)
  }
  return {
    core: core.map((r) => ({
      action: r.action as string,
      n: int(r.n),
      ok: int(r.ok),
      fail: int(r.fail),
      rejected: int(r.rejected),
      p50: r.p50 == null ? null : Math.round(Number(r.p50)),
      p95: r.p95 == null ? null : Math.round(Number(r.p95)),
      web: int(r.web),
      ios: int(r.ios),
      android: int(r.android),
      app: int(r.app),
    })),
    screens,
    pages,
    events: ev,
  }
}

// ── Content: what people work on, where actions start, latest free text ─────
async function content(w: Window, p: string, t: Tables) {
  const [subjects, sources, latestText] = await Promise.all([
    // Subjects of grades entered in range; platform from the action that created
    // them (rows saved before tracking went live count as "unknown").
    q(
      `WITH g AS (
         SELECT q.subject_id, COALESCE(a.platform, 'unknown') AS platform
           FROM ${t.quick_grades} q
           LEFT JOIN ${t.action_log} a ON a.result_id = q.id AND a.action = 'grade_quick_save'
          WHERE q.created_at >= $1 AND q.created_at < $2
         UNION ALL
         SELECT sg.subject_id, COALESCE(a.platform, 'unknown')
           FROM ${t.subject_grades} sg JOIN ${t.term_grades} t ON t.id = sg.term_grade_id
           LEFT JOIN ${t.action_log} a ON a.result_id = t.id AND a.action = 'grade_term_save'
          WHERE t.created_at >= $1 AND t.created_at < $2)
       SELECT COALESCE(s.name->>'en', s.name->>'de', s.code) AS subject, COUNT(*) AS n,
              COUNT(*) FILTER (WHERE g.platform = 'web') AS web,
              COUNT(*) FILTER (WHERE g.platform = 'ios') AS ios,
              COUNT(*) FILTER (WHERE g.platform = 'android') AS android,
              COUNT(*) FILTER (WHERE g.platform IN ('app', 'unknown')) AS other
         FROM g JOIN subjects s ON s.id = g.subject_id
        WHERE ($3 = 'all' OR g.platform = $3)
        GROUP BY 1 ORDER BY n DESC LIMIT 25`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT action, COALESCE(source, '(not sent)') AS source, COUNT(*) AS n
         FROM ${t.action_log} WHERE outcome = 'ok' AND ts >= $1 AND ts < $2 AND ${P} AND ${CORE}
        GROUP BY 1, 2 ORDER BY n DESC LIMIT 30`,
      [w.from, w.to, p]
    ),
    // Feedback comments and contact messages: raw text is kept 30 days.
    q(
      `SELECT ts, kind, platform, rating, LEFT(comment, 400) AS comment, lang, country
         FROM ${t.feedback} WHERE comment IS NOT NULL AND ($1 = 'all' OR platform = $1)
        ORDER BY ts DESC LIMIT 30`,
      [p]
    ),
  ])
  return { subjects, sources, latestText }
}

// ── Acquisition ──────────────────────────────────────────────────────────────
async function acquisition(w: Window, p: string, t: Tables) {
  const [visits, installs, invites, storeSrc] = await Promise.all([
    q(
      `SELECT props->>'acq_source' AS source, NULLIF(props->>'acq_medium', '') AS medium,
              NULLIF(props->>'acq_campaign', '') AS campaign, COUNT(*) AS n
         FROM ${t.usage_events} WHERE props ? 'acq_source' AND ts >= $1 AND ts < $2 AND ${P}
        GROUP BY 1, 2, 3 ORDER BY n DESC LIMIT 20`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT platform, COALESCE(acq_source, '(direct / store)') AS source, acq_campaign AS campaign, COUNT(*) AS n
         FROM ${t.usage_installs} WHERE first_seen >= $1 AND first_seen < $2 AND ${P}
        GROUP BY 1, 2, 3 ORDER BY n DESC LIMIT 20`,
      [w.from, w.to, p]
    ),
    // Invite funnel: codes created (records) → invite page/link opened (tracked)
    // → codes redeemed = families connected (records).
    q(
      `SELECT
         (SELECT COUNT(*) FROM ${t.parent_child_invites} WHERE created_at >= $1 AND created_at < $2) AS created,
         (SELECT COUNT(*) FROM ${t.usage_events} WHERE event = 'invite_open' AND ts >= $1 AND ts < $2 AND ${P}) AS opened,
         (SELECT COUNT(*) FROM ${t.usage_events} WHERE event = 'invite_share' AND ts >= $1 AND ts < $2 AND ${P}) AS shared,
         (SELECT COUNT(*) FROM ${t.parent_child_invites} WHERE status = 'accepted' AND created_at >= $1 AND created_at < $2) AS redeemed,
         (SELECT COUNT(*) FROM ${t.user_profiles} p WHERE p.role = 'child' AND p.created_at >= $1 AND p.created_at < $2
            AND EXISTS (SELECT 1 FROM ${t.parent_child_invites} i WHERE i.child_id = p.id AND i.status = 'accepted')) AS new_children`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT platform, metric, SUM(value) AS n FROM store_daily
        WHERE (metric LIKE 'src:%' OR metric LIKE 'cmp:%' OR metric LIKE 'ref:%')
          AND day >= $1::date AND day < $2::date AND ${P}
        GROUP BY 1, 2 ORDER BY n DESC LIMIT 30`,
      [w.from, w.to, p]
    ),
  ])
  const i = invites[0]
  return {
    visits,
    installs,
    invites: {
      created: int(i.created),
      shared: int(i.shared),
      opened: int(i.opened),
      redeemed: int(i.redeemed),
      newChildren: int(i.new_children),
    },
    store: storeSrc,
  }
}

// D1 / D7: share of installs first seen on day X that were active again on X+1 / X+7.
async function retention(w: Window, p: string, t: Tables) {
  const rows = await q(
    `WITH cohort AS (
       SELECT install_id, (first_seen AT TIME ZONE 'UTC')::date AS d0 FROM ${t.usage_installs}
        WHERE first_seen >= $1 AND first_seen < $2 AND ${P}),
     act AS (
       SELECT install_id, (ts AT TIME ZONE 'UTC')::date AS d FROM ${t.usage_events} WHERE install_id IS NOT NULL AND ts >= $1
       UNION
       SELECT install_id, (ts AT TIME ZONE 'UTC')::date FROM ${t.action_log} WHERE install_id IS NOT NULL AND ts >= $1)
     SELECT
       COUNT(*) FILTER (WHERE c.d0 <= (NOW() AT TIME ZONE 'UTC')::date - 1) AS d1_base,
       COUNT(*) FILTER (WHERE c.d0 <= (NOW() AT TIME ZONE 'UTC')::date - 1 AND EXISTS (SELECT 1 FROM act a WHERE a.install_id = c.install_id AND a.d = c.d0 + 1)) AS d1,
       COUNT(*) FILTER (WHERE c.d0 <= (NOW() AT TIME ZONE 'UTC')::date - 7) AS d7_base,
       COUNT(*) FILTER (WHERE c.d0 <= (NOW() AT TIME ZONE 'UTC')::date - 7 AND EXISTS (SELECT 1 FROM act a WHERE a.install_id = c.install_id AND a.d = c.d0 + 7)) AS d7
     FROM cohort c`,
    // Cohorts need at least 7 days of follow-up, so look back past short ranges.
    [new Date(Math.min(w.from.getTime(), Date.now() - 37 * 86_400_000)), w.to, p]
  )
  const r = rows[0]
  const pct = (a: unknown, b: unknown) => (int(b) ? int(a) / int(b) : null)
  return {
    d1: pct(r.d1, r.d1_base),
    d1Base: int(r.d1_base),
    d7: pct(r.d7, r.d7_base),
    d7Base: int(r.d7_base),
  }
}

// ── Feedback & implicit quality signals ──────────────────────────────────────
async function feedback(w: Window, p: string, t: Tables) {
  const F = `ts >= $1 AND ts < $2 AND ${P}`
  const [app, appDist, appPrev, results, contact, prompts, redo] = await Promise.all([
    q(
      `SELECT COUNT(*) AS n, AVG(rating)::float AS avg,
              COUNT(*) FILTER (WHERE platform = 'web') AS web,
              COUNT(*) FILTER (WHERE platform = 'ios') AS ios,
              COUNT(*) FILTER (WHERE platform = 'android') AS android
         FROM ${t.feedback} WHERE kind = 'app' AND ${F}`,
      [w.from, w.to, p]
    ),
    q(`SELECT rating, COUNT(*) AS n FROM ${t.feedback} WHERE kind = 'app' AND ${F} GROUP BY 1`, [
      w.from,
      w.to,
      p,
    ]),
    q(
      `SELECT COUNT(*) AS n, AVG(rating)::float AS avg FROM ${t.feedback} WHERE kind = 'app' AND ${F}`,
      [w.prevFrom, w.from, p]
    ),
    q(
      `SELECT COALESCE(action, '—') AS action, COUNT(*) AS n, AVG(rating)::float AS avg
         FROM ${t.feedback} WHERE kind = 'result' AND ${F} GROUP BY 1 ORDER BY n DESC`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT COUNT(*) AS n,
              COUNT(*) FILTER (WHERE rating IS NULL AND comment IS NULL) AS redacted
         FROM ${t.feedback} WHERE kind = 'contact' AND ${F}`,
      [w.from, w.to, p]
    ),
    q(
      `SELECT event, COUNT(*) AS n FROM ${t.usage_events}
        WHERE event IN ('review_prompt', 'review_store_open', 'feedback_open') AND ${F} GROUP BY 1`,
      [w.from, w.to, p]
    ),
    // Implicit quality: report-card scans per saved report, and edits of saved reports.
    q(
      `SELECT COUNT(*) FILTER (WHERE action = 'report_scan' AND outcome = 'ok') AS scans,
              COUNT(*) FILTER (WHERE action = 'grade_term_save' AND outcome = 'ok') AS saves,
              COUNT(*) FILTER (WHERE action = 'grade_term_update' AND outcome = 'ok') AS edits,
              COUNT(DISTINCT ${uid('a')}) FILTER (WHERE action = 'report_scan') AS scanners
         FROM ${t.action_log} a WHERE ${F}`,
      [w.from, w.to, p]
    ),
  ])
  const ev = Object.fromEntries(prompts.map((r) => [r.event, int(r.n)]))
  return {
    app: {
      n: int(app[0].n),
      avg: app[0].avg as number | null,
      prevN: int(appPrev[0].n),
      prevAvg: appPrev[0].avg as number | null,
      byPlatform: { web: int(app[0].web), ios: int(app[0].ios), android: int(app[0].android) },
      distribution: [1, 2, 3, 4, 5].map((r) => ({
        rating: r,
        n: int(appDist.find((x) => int(x.rating) === r)?.n),
      })),
    },
    results: results.map((r) => ({
      action: r.action as string,
      n: int(r.n),
      avg: r.avg as number,
    })),
    contact: { n: int(contact[0].n) },
    reviewPrompts: {
      shown: ev.review_prompt || 0,
      storeOpened: ev.review_store_open || 0,
      feedbackOpened: ev.feedback_open || 0,
    },
    redo: {
      scans: int(redo[0].scans),
      saves: int(redo[0].saves),
      edits: int(redo[0].edits),
      scanners: int(redo[0].scanners),
    },
  }
}

// ── Health ───────────────────────────────────────────────────────────────────
async function health(w: Window, p: string, t: Tables) {
  const [providers, outcomes, countries, langs, versions, botGate, quota, imports] =
    await Promise.all([
      q(
        `SELECT COALESCE(provider, 'db') AS provider, COUNT(*) AS n,
                COUNT(*) FILTER (WHERE outcome = 'ok') AS ok,
                percentile_cont(0.5)  WITHIN GROUP (ORDER BY latency_ms) AS p50,
                percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95
           FROM ${t.action_log} WHERE ts >= $1 AND ts < $2 AND ${P} AND ${CORE}
          GROUP BY 1 ORDER BY n DESC`,
        [w.from, w.to, p]
      ),
      q(
        `SELECT outcome, COUNT(*) AS n FROM ${t.action_log}
          WHERE ts >= $1 AND ts < $2 AND ${P} AND ${CORE} GROUP BY 1 ORDER BY n DESC`,
        [w.from, w.to, p]
      ),
      q(
        `SELECT country, COUNT(DISTINCT uid) AS users FROM (${activity(t)}) x
          WHERE country IS NOT NULL AND uid IS NOT NULL GROUP BY 1 ORDER BY users DESC LIMIT 12`,
        [w.from, w.to, p]
      ),
      q(
        `SELECT lang, COUNT(DISTINCT uid) AS users FROM (${activity(t)}) x
          WHERE lang IS NOT NULL AND uid IS NOT NULL GROUP BY 1 ORDER BY users DESC LIMIT 12`,
        [w.from, w.to, p]
      ),
      q(
        `SELECT platform, app_version, COUNT(DISTINCT install_id) AS installs FROM (
           SELECT platform, app_version, install_id, ts FROM ${t.usage_events}
           UNION ALL
           SELECT platform, app_version, install_id, ts FROM ${t.action_log}) x
          WHERE app_version IS NOT NULL AND platform IN ('ios', 'android') AND ts >= $1 AND ts < $2 AND ${P}
          GROUP BY 1, 2 ORDER BY installs DESC LIMIT 12`,
        [w.from, w.to, p]
      ),
      q(
        `SELECT (ts AT TIME ZONE 'UTC')::date::text AS day,
                COUNT(*) FILTER (WHERE outcome = 'ok') AS ok,
                COUNT(*) FILTER (WHERE outcome <> 'ok') AS blocked
           FROM ${t.action_log} WHERE action = 'bot_check' AND ts >= $1 AND ts < $2
          GROUP BY 1 ORDER BY 1 DESC`,
        [w.from, w.to]
      ),
      // External quota: FMP (free plan 250 requests/day) and today's OCR scans.
      q(
        `SELECT COUNT(*) FILTER (WHERE action = 'market_fetch') AS fmp,
                COUNT(*) FILTER (WHERE action = 'report_scan') AS scans
           FROM action_log WHERE ts >= (NOW() AT TIME ZONE 'UTC')::date`
      ),
      q(`SELECT source, ran_at, ok, detail FROM store_import_status ORDER BY source`),
    ])
  return {
    providers: providers.map((r) => ({
      provider: r.provider as string,
      n: int(r.n),
      ok: int(r.ok),
      p50: r.p50 == null ? null : Math.round(Number(r.p50)),
      p95: r.p95 == null ? null : Math.round(Number(r.p95)),
    })),
    outcomes,
    countries,
    languages: langs,
    versions,
    botGate: botGate.map((r) => ({ day: r.day as string, ok: int(r.ok), blocked: int(r.blocked) })),
    quota: {
      fmpToday: int(quota[0].fmp),
      fmpLimit: Number(process.env.FMP_DAILY_LIMIT || 250),
      scansToday: int(quota[0].scans),
    },
    imports,
  }
}

// ── Activity per day / week / month (the "Activity by period" table) ────────
/** Start of the bucket containing a UTC day (weeks start on Monday, like date_trunc). */
export function bucketStart(day: string, bucket: Bucket): string {
  const d = new Date(`${day}T00:00:00Z`)
  if (bucket === 'month') return `${day.slice(0, 7)}-01`
  if (bucket === 'week') d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

async function activityTable(w: Window, p: string, t: Tables, bucket: Bucket) {
  // Same day expression as the rest of the dashboard, truncated to the bucket.
  const per = (col: string) =>
    `date_trunc($4, (${col} AT TIME ZONE 'UTC')::date::timestamp)::date::text`
  const args = [w.from, w.to, p, bucket]
  const [users, opens, actions, installs, accounts, grades, downloads] = await Promise.all([
    q(
      `SELECT ${per('ts')} AS period, COUNT(DISTINCT uid) AS users,
              COUNT(DISTINCT uid) FILTER (WHERE platform = 'web') AS web,
              COUNT(DISTINCT uid) FILTER (WHERE platform = 'ios') AS ios,
              COUNT(DISTINCT uid) FILTER (WHERE platform IN ('android', 'app')) AS android
         FROM (${activity(t)}) a WHERE uid IS NOT NULL GROUP BY 1`,
      args
    ),
    q(
      `SELECT ${per('ts')} AS period, COUNT(*) AS n FROM ${t.usage_events}
        WHERE event = 'app_open' AND ts >= $1 AND ts < $2 AND ${P} GROUP BY 1`,
      args
    ),
    q(
      `SELECT ${per('ts')} AS period, COUNT(*) AS n FROM ${t.action_log}
        WHERE outcome = 'ok' AND ts >= $1 AND ts < $2 AND ${P} AND ${CORE} GROUP BY 1`,
      args
    ),
    q(
      `SELECT ${per('first_seen')} AS period, COUNT(*) AS n FROM ${t.usage_installs}
        WHERE first_seen >= $1 AND first_seen < $2 AND ${P} GROUP BY 1`,
      args
    ),
    q(
      `SELECT ${per('created_at')} AS period, COUNT(*) AS n FROM ${t.user_profiles}
        WHERE created_at >= $1 AND created_at < $2 AND role <> 'admin' AND $3::text IS NOT NULL GROUP BY 1`,
      args
    ),
    q(
      `SELECT period, COUNT(*) AS n FROM (
         SELECT ${per('created_at')} AS period FROM ${t.quick_grades} WHERE created_at >= $1 AND created_at < $2
         UNION ALL
         SELECT ${per('created_at')} FROM ${t.term_grades} WHERE created_at >= $1 AND created_at < $2) g
        WHERE $3::text IS NOT NULL GROUP BY 1`,
      args
    ),
    q(
      `SELECT date_trunc($4, day::timestamp)::date::text AS period, SUM(value) AS n FROM store_daily
        WHERE metric = 'downloads' AND day >= $1::date AND day < $2::date AND ${P} GROUP BY 1`,
      args
    ),
  ])
  const map = (rows: Row[], key = 'n') =>
    Object.fromEntries(rows.map((r) => [r.period as string, int(r[key])]))
  const u = Object.fromEntries(users.map((r) => [r.period as string, r]))
  const [o, a, i, acc, g, dl] = [opens, actions, installs, accounts, grades, downloads].map((r) =>
    map(r)
  )
  const periods = [...new Set(dayList(w).map((d) => bucketStart(d, bucket)))].reverse()
  return periods.map((period) => ({
    period,
    users: int(u[period]?.users),
    web: int(u[period]?.web),
    ios: int(u[period]?.ios),
    android: int(u[period]?.android),
    opens: o[period] || 0,
    actions: a[period] || 0,
    installs: i[period] || 0,
    accounts: acc[period] || 0,
    grades: g[period] || 0,
    downloads: dl[period] || 0,
  }))
}

// ── What "real users" leaves out ─────────────────────────────────────────────
async function excludedActivity(w: Window, p: string) {
  return q(
    `SELECT cls, COUNT(DISTINCT uid) AS people, COUNT(*) AS rows FROM (
       SELECT x.uid, COALESCE(x.traffic, i.traffic, c1.class, c2.class) AS cls FROM (
         SELECT traffic, install_id, user_id, ${uid('e')} AS uid FROM usage_events e
          WHERE ts >= $1 AND ts < $2 AND ${P}
         UNION ALL
         SELECT traffic, install_id, user_id, ${uid('a')} FROM action_log a
          WHERE ts >= $1 AND ts < $2 AND ${P} AND action <> 'bot_check') x
       LEFT JOIN usage_installs i ON i.install_id = x.install_id
       LEFT JOIN stats_account_class c1 ON c1.user_id = x.user_id AND c1.class <> 'real'
       LEFT JOIN stats_account_class c2 ON c2.user_id = i.user_id AND c2.class <> 'real') y
     WHERE cls IS NOT NULL GROUP BY 1 ORDER BY people DESC`,
    [w.from, w.to, p]
  )
}

async function trackingSince() {
  const rows = await q(
    `SELECT LEAST((SELECT MIN(ts) FROM usage_events), (SELECT MIN(ts) FROM action_log)) AS since`
  )
  return rows[0].since ? new Date(rows[0].since as string).toISOString() : null
}

export interface StatsQuery {
  range?: string
  platform?: string
  from?: string | null
  to?: string | null
  traffic?: string
  bucket?: string
}

export async function getStats(o: StatsQuery = {}) {
  const range = (RANGES as readonly string[]).includes(o.range ?? '') ? (o.range as Range) : '7d'
  const platform = (PLATFORMS as readonly string[]).includes(o.platform ?? '') ? o.platform! : 'all'
  const traffic = o.traffic === 'all' ? 'all' : 'real'
  const w = rangeWindow(range, o.from, o.to)
  const bucket: Bucket = (BUCKETS as readonly string[]).includes(o.bucket ?? '')
    ? (o.bucket as Bucket)
    : w.days > 120
      ? 'month'
      : w.days > 31
        ? 'week'
        : 'day'
  // Classification feeds the stats_real_* views, so it runs first.
  await autoClassify().catch((e) => console.error('[stats] classify:', (e as Error).message))
  const t = tablesFor(traffic)
  const [k, rec, s, ser, us, ct, acq, ret, fb, h, since, act, excl, classified] = await Promise.all(
    [
      kpis(w, platform, t),
      records(w, t),
      store(w, platform, t),
      series(w, platform, t),
      usage(w, platform, t),
      content(w, platform, t),
      acquisition(w, platform, t),
      retention(w, platform, t),
      feedback(w, platform, t),
      health(w, platform, t),
      trackingSince(),
      activityTable(w, platform, t, bucket),
      excludedActivity(w, platform),
      listClassified(),
    ]
  )
  return {
    generatedAt: new Date().toISOString(),
    range,
    platform,
    traffic,
    bucket,
    trackingSince: since,
    from: w.from.toISOString().slice(0, 10),
    to: new Date(w.to.getTime() - 1).toISOString().slice(0, 10),
    days: w.days,
    kpis: k,
    records: rec,
    store: s,
    series: ser,
    usage: us,
    content: ct,
    acquisition: acq,
    retention: ret,
    feedback: fb,
    health: h,
    // Usage columns before the first tracked day are unknown, not zero.
    activity: act.map((r) => ({
      ...r,
      tracked: !!since && r.period >= bucketStart(since.slice(0, 10), bucket),
    })),
    excluded: {
      activity: excl.map((r) => ({
        class: r.cls as string,
        people: int(r.people),
        rows: int(r.rows),
      })),
      accounts: classified,
    },
  }
}

export type Stats = Awaited<ReturnType<typeof getStats>>
