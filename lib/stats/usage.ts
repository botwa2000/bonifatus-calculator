/**
 * First-party usage statistics (tables in migration 0022). Powers /admin/stats.
 *
 * Privacy model (children use this app — see the privacy policy):
 *   • No IP address, user agent or advertising ID is ever stored.
 *   • Apps: the random per-install ID they already send (X-Device-ID, or the
 *     device part of X-Mobile-Client-Token on builds that predate X-Device-ID).
 *   • Web with analytics consent: a random ID in localStorage.
 *   • Web without consent: a daily-rotating salted hash of (IP, user agent).
 *     The salt is random, kept 2 days, then deleted — the hash can then never
 *     be recomputed or linked across days. Counts unique visitors per day only.
 *   • Signed-in requests carry the account ID so "Delete account" can erase
 *     every statistics row of that person.
 *   • Country comes from Cloudflare's CF-IPCountry header (2 letters).
 *   • Free text (feedback comments, contact messages) is nulled after 30 days.
 *   • Store review and test devices are recognised by their network at request
 *     time (the IP is checked, never stored) and tagged in `traffic`, so the
 *     dashboard can show real users only. Crawlers are recognised the same way
 *     from the user agent (read, never stored). Anonymous web visitors count
 *     only once they interact: a first tap, scroll or key sends `engage`.
 * Every write is fire-and-forget: statistics must never slow or fail a request.
 */
import crypto from 'node:crypto'
import net from 'node:net'
import { pool } from '@/lib/db/client'
import { getClientIp } from '@/lib/auth/turnstile'

export type Platform = 'web' | 'ios' | 'android' | 'app'

const PLATFORMS = new Set(['web', 'ios', 'android'])
const INSTALL_RE = /^[0-9a-f]{16}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const VERSION_RE = /^[0-9A-Za-z.+_-]{1,32}$/
const SHORT_RE = /^[a-z0-9_.:-]{1,40}$/

export const RAW_TEXT_DAYS = 30
const EVENT_RETENTION_DAYS = 400 // 13 months: same-month-last-year comparisons

const header = (h: Headers, name: string) => (h.get(name) ?? '').trim()

export function cleanVersion(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return VERSION_RE.test(s) ? s : null
}

export function cleanInstallId(v: unknown): string | null {
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
  return INSTALL_RE.test(s) ? s : null
}

export function cleanShort(v: unknown): string | null {
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
  return SHORT_RE.test(s) ? s : null
}

export function cleanLang(v: unknown): string | null {
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 5)
  return /^[a-z]{2,3}(-[a-z]{2})?$/.test(s) ? s.slice(0, 2) : null
}

export function countryOf(h: Headers): string | null {
  const c = header(h, 'cf-ipcountry').toUpperCase()
  return /^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'T1' ? c : null
}

/** First language of Accept-Language ("de-DE,de;q=0.9" → "de"). */
function acceptLang(h: Headers): string | null {
  return cleanLang(header(h, 'accept-language').split(/[,;]/)[0])
}

// Apps send X-Platform (ios|android). Older app builds only send the signed
// X-Mobile-Client-Token / a Bearer JWT without an Origin → "app" (unknown OS).
export function platformOf(h: Headers): Platform {
  const p = header(h, 'x-platform').toLowerCase()
  if (PLATFORMS.has(p)) return p as Platform
  if (h.get('x-mobile-client-token') || (h.get('authorization') && !h.get('origin'))) return 'app'
  return 'web'
}

/** Install ID of a native request: X-Device-ID, else the device part of the mobile token. */
function nativeInstallId(h: Headers): string | null {
  const direct = cleanInstallId(header(h, 'x-device-id'))
  if (direct) return direct
  const token = header(h, 'x-mobile-client-token')
  const parts = token.split(':')
  return parts.length === 3 ? cleanInstallId(parts[2]) : null
}

// ── Daily salt for the unconsented-web visitor hash ──────────────────────────
let saltCache: { day: string | null; salt: string | null } = { day: null, salt: null }

async function todaysSalt(): Promise<string> {
  const day = new Date().toISOString().slice(0, 10)
  if (saltCache.day === day && saltCache.salt) return saltCache.salt
  // Shared across replicas: first writer wins, everyone reads the same salt.
  await pool.query(
    'INSERT INTO usage_salts (day, salt) VALUES ($1, $2) ON CONFLICT (day) DO NOTHING',
    [day, crypto.randomBytes(32).toString('base64')]
  )
  const { rows } = await pool.query('SELECT salt FROM usage_salts WHERE day = $1', [day])
  saltCache = { day, salt: rows[0].salt }
  return rows[0].salt
}

async function visitorHash(h: Headers): Promise<string> {
  const salt = await todaysSalt()
  return crypto
    .createHash('sha256')
    .update(`${salt}|${getClientIp(h) ?? ''}|${header(h, 'user-agent')}|${header(h, 'host')}`)
    .digest('base64url')
    .slice(0, 22)
}

// ── Store review / test devices ──────────────────────────────────────────────
// Apple App Review runs on Apple's own network (17.0.0.0/8). Google Play's
// pre-launch report runs on Firebase Test Lab, whose device ranges Google
// publishes (firebase.google.com/docs/test-lab/android/get-started, updated
// about yearly). A browser that signed in to /admin/stats carries
// INTERNAL_COOKIE (lib/stats/admin-auth.ts) on every page of the site.
//
// Web visitors start 'unengaged' and become real (traffic NULL) on their first
// interaction or core action, which also upgrades their earlier rows of the day.
// That keeps link scanners and one-glance bounces out of the numbers without
// deleting anything: they stay visible under "All traffic".
export type Traffic = 'review' | 'test' | 'internal' | 'bot' | 'unengaged'
export const INTERNAL_COOKIE = 'bstats_internal'

const BOT_UA =
  /bot\b|bot\/|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|skype|discord|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|curl\/|wget|python|httpclient|axios|node-fetch|go-http|java\//i

/** Runs on page load without anyone doing anything, so it proves no person. */
const PASSIVE_ACTIONS = new Set(['market_fetch'])

const APPLE_NET = new net.BlockList()
APPLE_NET.addSubnet('17.0.0.0', 8, 'ipv4')
// App Review devices also sign in from 139.178.128-131.x (seen Oct-Nov 2026).
APPLE_NET.addSubnet('139.178.128.0', 18, 'ipv4')

const TEST_LAB_NET = new net.BlockList()
for (const cidr of [
  '70.32.128.0/19',
  '108.177.6.0/23',
  '108.177.18.192/26',
  '108.177.29.64/27',
  '108.177.31.160/27',
  '199.36.156.8/29',
  '199.36.156.16/28',
  '209.85.131.0/27',
  '70.32.128.48/28',
  '70.32.150.192/27',
  '108.177.24.160/27',
  '108.177.29.0/27',
  '108.177.25.128/27',
  '108.177.26.128/26',
  '108.177.29.192/26',
  '172.217.120.64/26',
  '172.217.120.128/26',
  '34.68.194.64/29',
  '34.69.234.64/29',
  '34.73.34.72/29',
  '34.73.178.72/29',
  '34.74.10.72/29',
  '34.136.2.136/29',
  '34.136.50.136/29',
  '34.145.234.144/29',
  '35.192.160.56/29',
  '35.196.166.80/29',
  '35.196.169.240/29',
  '35.203.128.0/28',
  '35.234.176.160/28',
  '35.243.2.0/27',
  '35.245.243.240/29',
  '199.192.115.0/30',
  '199.192.115.8/30',
  '199.192.115.16/29',
  '2001:4860:1008::/48',
  '2001:4860:1018::/48',
  '2001:4860:1019::/48',
  '2001:4860:1020::/48',
  '2001:4860:1022::/48',
  '2001:4860:101d::/48',
  '2001:4860:101e::/48',
  '2001:4860:1031::/48',
  '2001:4860:1037::/48',
  '2001:4860:1038::/48',
  '2001:4860:103a::/48',
  // Google Play's pre-launch / app-access robots sign in from Google's own
  // crawler and infrastructure space (66.249.84/88.x, 74.125.210.x, Oct-Nov
  // 2026), which no real person uses.
  '66.249.64.0/19',
  '74.125.0.0/16',
]) {
  const [ip, bits] = cidr.split('/')
  TEST_LAB_NET.addSubnet(ip, Number(bits), ip.includes(':') ? 'ipv6' : 'ipv4')
}

const inNet = (list: net.BlockList, ip: string) => {
  const family = net.isIPv4(ip) ? 'ipv4' : net.isIPv6(ip) ? 'ipv6' : null
  return family ? list.check(ip, family) : false
}

export function trafficOf(h: Headers): Traffic | null {
  if (/(?:^|;\s*)bstats_internal=1(?:;|$)/.test(h.get('cookie') ?? '')) return 'internal'
  // Debug / profile app builds and emulators. Only ever hides the sender from
  // "real users", so a forged header gains nothing.
  if (header(h, 'x-internal') === '1') return 'internal'
  const ip = getClientIp(h)
  if (!ip) return null
  if (inNet(APPLE_NET, ip)) return 'review'
  if (inNet(TEST_LAB_NET, ip)) return 'test'
  return null
}

/** Class of a web request that is neither store review, test device nor team. */
export function webTraffic(
  h: Headers,
  o: { userId?: string | null; webdriver?: boolean } = {}
): 'bot' | 'unengaged' | null {
  const ua = header(h, 'user-agent')
  if (!ua || BOT_UA.test(ua) || o.webdriver) return 'bot'
  return o.userId ? null : 'unengaged'
}

export interface RequestContext {
  platform: Platform
  installId: string | null
  visitorHash: string | null
  userId: string | null
  version: string | null
  lang: string | null
  country: string | null
  traffic: Traffic | null
}

/**
 * Everything a stats writer needs to know about the caller. The install ID is
 * the app's (header) or, on the web, the consented ID from the body; without
 * either, web requests get the daily visitor hash.
 */
export async function requestContext(
  h: Headers,
  opts: {
    bodyInstallId?: unknown
    bodyLang?: unknown
    userId?: string | null
    webdriver?: boolean
  } = {}
): Promise<RequestContext> {
  const platform = platformOf(h)
  const installId = platform === 'web' ? cleanInstallId(opts.bodyInstallId) : nativeInstallId(h)
  return {
    platform,
    installId,
    visitorHash: installId || platform !== 'web' ? null : await visitorHash(h),
    userId: opts.userId ?? null,
    version: cleanVersion(header(h, 'x-app-version')),
    lang: cleanLang(opts.bodyLang) || cleanLang(header(h, 'x-app-lang')) || acceptLang(h),
    country: countryOf(h),
    traffic:
      trafficOf(h) ??
      (platform === 'web'
        ? webTraffic(h, { userId: opts.userId, webdriver: opts.webdriver })
        : null),
  }
}

const logErr = (where: string) => (err: Error) =>
  console.error(`[usage] ${where} failed:`, err.message)

// ── Engagement ───────────────────────────────────────────────────────────────
// Visitors seen engaged today; cleared at UTC midnight (visitor hashes rotate daily).
let engagedCache: { day: string | null; set: Set<string> } = { day: null, set: new Set() }

function cacheEngaged(id: string) {
  const day = new Date().toISOString().slice(0, 10)
  if (engagedCache.day !== day) engagedCache = { day, set: new Set() }
  if (engagedCache.set.size > 50_000) engagedCache.set.clear()
  engagedCache.set.add(id)
}

const RECENT = `ts > NOW() - INTERVAL '1 day' AND (install_id = $1 OR visitor_hash = $2)`

async function isEngaged(ctx: RequestContext): Promise<boolean> {
  const id = ctx.installId || ctx.visitorHash
  if (!id) return false
  if (engagedCache.set.has(id) && engagedCache.day === new Date().toISOString().slice(0, 10))
    return true
  const { rows } = await pool.query(
    `SELECT 1 FROM usage_events WHERE traffic IS NULL AND platform = 'web' AND ${RECENT} LIMIT 1`,
    [ctx.installId, ctx.visitorHash]
  )
  if (rows.length) cacheEngaged(id)
  return rows.length > 0
}

// A person, after all: count what this visitor did so far today.
async function markEngaged(ctx: RequestContext) {
  const id = ctx.installId || ctx.visitorHash
  if (!id) return
  cacheEngaged(id)
  const args = [ctx.installId, ctx.visitorHash]
  for (const table of ['usage_events', 'action_log'])
    await pool.query(
      `UPDATE ${table} SET traffic = NULL WHERE traffic = 'unengaged' AND ${RECENT}`,
      args
    )
  if (ctx.installId)
    await pool.query(
      `UPDATE usage_installs SET traffic = NULL WHERE install_id = $1 AND traffic = 'unengaged'`,
      [ctx.installId]
    )
}

/** Settles an 'unengaged' request: real if it proves a person or one was seen before. */
async function settleTraffic(ctx: RequestContext, proof: boolean): Promise<RequestContext> {
  if (ctx.traffic !== 'unengaged') return ctx
  if (proof) await markEngaged(ctx)
  else if (!(await isEngaged(ctx))) return ctx
  return { ...ctx, traffic: null }
}

// First/last sighting of an install. Acquisition is first-touch: an existing
// source is never overwritten (COALESCE keeps the stored value).
async function touchInstall(
  ctx: RequestContext,
  acq: { source?: string | null; medium?: string | null; campaign?: string | null } = {}
) {
  if (!ctx.installId) return
  await pool.query(
    `INSERT INTO usage_installs (install_id, platform, first_version, country, user_id, acq_source, acq_medium, acq_campaign, traffic)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (install_id) DO UPDATE SET
       last_seen    = NOW(),
       platform     = CASE WHEN usage_installs.platform = 'app' THEN EXCLUDED.platform ELSE usage_installs.platform END,
       user_id      = COALESCE(EXCLUDED.user_id, usage_installs.user_id),
       acq_source   = COALESCE(usage_installs.acq_source, EXCLUDED.acq_source),
       acq_medium   = COALESCE(usage_installs.acq_medium, EXCLUDED.acq_medium),
       acq_campaign = COALESCE(usage_installs.acq_campaign, EXCLUDED.acq_campaign),
       traffic      = CASE
         WHEN usage_installs.traffic IN ('review', 'test', 'internal') THEN usage_installs.traffic
         WHEN EXCLUDED.traffic IN ('review', 'test', 'internal') THEN EXCLUDED.traffic
         WHEN usage_installs.traffic IS NULL OR EXCLUDED.traffic IS NULL THEN NULL
         ELSE usage_installs.traffic END`,
    [
      ctx.installId,
      ctx.platform,
      ctx.version,
      ctx.country,
      ctx.userId,
      acq.source ?? null,
      acq.medium ?? null,
      acq.campaign ?? null,
      ctx.traffic,
    ]
  )
}

// ── Core actions (lib/stats/with-action-log.ts) ──────────────────────────────
export type Outcome = 'ok' | 'invalid' | 'denied' | 'not_found' | 'rate_limited' | 'fail'

export interface ActionRecord {
  action: string
  outcome: Outcome
  statusCode: number
  latencyMs: number
  provider?: string | null
  resultId?: string | null
  source?: string | null
}

/** Record one core-action request. Never throws, never awaited by the caller. */
export function recordAction(context: RequestContext, a: ActionRecord): void {
  ;(async () => {
    const ctx = await settleTraffic(context, a.outcome === 'ok' && !PASSIVE_ACTIONS.has(a.action))
    await pool.query(
      `INSERT INTO action_log
         (platform, app_version, install_id, visitor_hash, user_id, action, source, outcome, status_code, latency_ms, provider, result_id, lang, country, traffic)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        ctx.platform,
        ctx.version,
        ctx.installId,
        ctx.visitorHash,
        ctx.userId,
        a.action,
        cleanShort(a.source),
        a.outcome,
        a.statusCode,
        Math.round(a.latencyMs),
        a.provider ?? null,
        a.resultId ? String(a.resultId).slice(0, 80) : null,
        ctx.lang,
        ctx.country,
        ctx.traffic,
      ]
    )
    await touchInstall(ctx)
  })().catch(logErr('recordAction'))
}

/** Turnstile outcome, for the dashboard's bot-check health box (web forms only). */
export function recordBotCheck(ok: boolean): void {
  pool
    .query(
      `INSERT INTO action_log (platform, action, outcome, status_code) VALUES ('web', 'bot_check', $1, $2)`,
      [ok ? 'ok' : 'denied', ok ? 200 : 403]
    )
    .catch(logErr('recordBotCheck'))
}

// ── Client events (POST /api/t) ──────────────────────────────────────────────
// The whitelist is the contract with the clients (components/analytics/
// UsageBeacon.tsx and the Flutter UsageService). Unknown events are dropped.
export const EVENTS = new Set([
  'app_open', // app cold start / resume; web: first page view of a visit
  'engage', // web: first tap, scroll or key of a visit; marks the visitor as a person
  'page_view', // web page (path)
  'screen_view', // app screen (route template)
  'calculator_result', // a bonus was calculated (web calculator / app)
  'scan_open', // report-card scanner opened
  'scan_result', // on-device scan finished (props: count, result ok|empty|error)
  'invite_open', // the /invite page or an invite deep link was opened
  'invite_share', // a parent shared an invite code / QR
  'review_prompt', // the store review prompt was shown
  'review_store_open', // the store page was opened from the app
  'feedback_open', // the feedback form was opened
  'signup_start', // registration form shown
  'error',
])
const MAX_EVENTS_PER_BATCH = 50
// Props are an allow-list too: small enums/flags only. Free text (a name, a
// note) can never be stored through an event, whatever a client sends.
const PROP_KEYS = new Set(['source', 'mode', 'role', 'reason', 'count', 'fatal', 'result'])

export function cleanScreen(s: unknown): string | null {
  const v = String(s ?? '').trim()
  if (!v) return null
  // Web paths keep only the path (no query/hash); app routes are templates.
  return (
    v
      .split(/[?#]/)[0]
      .replace(/[^\w/:.[\]-]/g, '')
      .slice(0, 120) || null
  )
}

export function cleanProps(p: unknown): Record<string, string | number | boolean> | null {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null
  const out: Record<string, string | number | boolean> = {}
  let n = 0
  for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
    if (n >= 8 || !PROP_KEYS.has(k)) continue
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
    else if (typeof v === 'boolean') out[k] = v
    else if (typeof v === 'string') {
      const s = cleanShort(v)
      if (!s) continue
      out[k] = s
    } else continue
    n++
  }
  return n ? out : null
}

// Referrer → bare host (never the full URL); our own domains are not referrers.
export function referrerHost(ref: unknown): string | null {
  try {
    const h = new URL(String(ref)).hostname.toLowerCase().replace(/^www\./, '')
    return h && !h.endsWith('bonifatus.com') && h !== 'localhost' ? h.slice(0, 80) : null
  } catch {
    return null
  }
}

export function acquisitionOf(body: { acq?: unknown }) {
  const a = (body.acq && typeof body.acq === 'object' ? body.acq : {}) as Record<string, unknown>
  const ref = referrerHost(a.referrer)
  return {
    source: cleanShort(a.utm_source) || cleanShort(a.source) || ref,
    medium: cleanShort(a.utm_medium) || cleanShort(a.medium) || (ref ? 'referral' : null),
    campaign: cleanShort(a.utm_campaign) || cleanShort(a.campaign),
  }
}

export interface EventBatch {
  iid?: unknown
  v?: unknown
  lang?: unknown
  acq?: unknown
  wd?: unknown
  events?: unknown
}

/**
 * Store a batch from POST /api/t. Body:
 *   { iid?, v?, lang?, wd? (navigator.webdriver),
 *     acq?: {utm_source, utm_medium, utm_campaign, referrer, source, medium, campaign},
 *     events: [{ e, s?, p?, t? }] }
 * Returns the number of accepted events.
 */
export async function recordEvents(
  h: Headers,
  body: EventBatch,
  userId: string | null
): Promise<number> {
  const list = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS_PER_BATCH) : []
  const now = Date.now()
  const rows: {
    e: string
    s: string | null
    p: Record<string, string | number | boolean> | null
    ts: Date
  }[] = []
  for (const ev of list as { e?: unknown; s?: unknown; p?: unknown; t?: unknown }[]) {
    if (!ev || typeof ev.e !== 'string' || !EVENTS.has(ev.e)) continue
    // Client timestamps (queued offline) are accepted up to 3 days back, never future.
    const t = Number(ev.t)
    const ts =
      Number.isFinite(t) && t <= now && t > now - 3 * 86_400_000 ? new Date(t) : new Date(now)
    rows.push({ e: ev.e, s: cleanScreen(ev.s), p: cleanProps(ev.p), ts })
  }
  if (!rows.length) return 0

  const ctx = await settleTraffic(
    await requestContext(h, {
      bodyInstallId: body.iid,
      bodyLang: body.lang,
      userId,
      webdriver: body.wd === true,
    }),
    rows.some((r) => r.e === 'engage')
  )
  ctx.version = cleanVersion(body.v) || ctx.version
  const acq = acquisitionOf(body)
  if (acq.source || acq.campaign) {
    // Acquisition is also counted per visit (unconsented web has no install row).
    rows[0].p = {
      ...(rows[0].p || {}),
      acq_source: acq.source || '',
      acq_medium: acq.medium || '',
      acq_campaign: acq.campaign || '',
    }
  }

  const values: string[] = []
  const params: unknown[] = []
  rows.forEach((r, i) => {
    const o = i * 12
    values.push(`(${Array.from({ length: 12 }, (_, k) => `$${o + k + 1}`).join(',')})`)
    params.push(
      r.ts,
      ctx.platform,
      ctx.version,
      ctx.installId,
      ctx.visitorHash,
      ctx.userId,
      r.e,
      r.s,
      r.p ? JSON.stringify(r.p) : null,
      ctx.lang,
      ctx.country,
      ctx.traffic
    )
  })
  await pool.query(
    `INSERT INTO usage_events (ts, platform, app_version, install_id, visitor_hash, user_id, event, screen, props, lang, country, traffic)
     VALUES ${values.join(',')}`,
    params
  )
  await touchInstall(ctx, acq)
  return rows.length
}

// ── Feedback (POST /api/feedback, POST /api/contact) ─────────────────────────
export interface FeedbackRecord {
  kind: 'app' | 'result' | 'contact'
  rating?: number | null
  comment?: string | null
  resultId?: string | null
  action?: string | null
}

export async function recordFeedback(context: RequestContext, f: FeedbackRecord): Promise<void> {
  const ctx = await settleTraffic(context, true) // writing to us proves a person
  await pool.query(
    `INSERT INTO feedback (kind, platform, app_version, install_id, visitor_hash, user_id, rating, comment, result_id, action, lang, country, traffic)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      f.kind,
      ctx.platform,
      ctx.version,
      ctx.installId,
      ctx.visitorHash,
      ctx.userId,
      f.rating ?? null,
      f.comment ? f.comment.slice(0, 2000) : null,
      f.resultId ? String(f.resultId).slice(0, 80) : null,
      cleanShort(f.action),
      ctx.lang,
      ctx.country,
      ctx.traffic,
    ]
  )
}

// "Delete account": erase every statistics row tied to this account and to
// the installs it used. Rows without a user or install stay anonymous.
export async function forgetUser(userId: string): Promise<void> {
  const { rows } = await pool.query<{ install_id: string }>(
    'SELECT install_id FROM usage_installs WHERE user_id = $1',
    [userId]
  )
  const installs = rows.map((r) => r.install_id)
  for (const table of ['usage_events', 'action_log', 'feedback']) {
    await pool.query(`DELETE FROM ${table} WHERE user_id = $1 OR install_id = ANY($2::text[])`, [
      userId,
      installs,
    ])
  }
  await pool.query(
    'DELETE FROM usage_installs WHERE user_id = $1 OR install_id = ANY($2::text[])',
    [userId, installs]
  )
}

// ── Retention ────────────────────────────────────────────────────────────────
export async function purgeUsage(): Promise<void> {
  try {
    const days = (n: number) => `${n} days`
    await pool.query(
      `UPDATE feedback SET comment = NULL WHERE comment IS NOT NULL AND ts < NOW() - $1::interval`,
      [days(RAW_TEXT_DAYS)]
    )
    for (const table of ['usage_events', 'action_log', 'feedback']) {
      await pool.query(`DELETE FROM ${table} WHERE ts < NOW() - $1::interval`, [
        days(EVENT_RETENTION_DAYS),
      ])
    }
    await pool.query(`DELETE FROM usage_installs WHERE last_seen < NOW() - $1::interval`, [
      days(EVENT_RETENTION_DAYS),
    ])
    await pool.query(`DELETE FROM usage_salts WHERE day < (NOW() AT TIME ZONE 'UTC')::date - 1`)
    await pool.query(`DELETE FROM stats_rate_limits WHERE ts < NOW() - INTERVAL '1 day'`)
    await pool.query(`DELETE FROM stats_login_links WHERE expires_at < NOW() - INTERVAL '1 day'`)
  } catch (err) {
    console.error('[usage] purge failed:', (err as Error).message)
  }
}
