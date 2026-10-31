/**
 * Nightly import of store numbers into store_daily / store_reviews
 * (migration 0022) for /admin/stats. Each feed runs independently and writes
 * its outcome to store_import_status, so the dashboard shows exactly which
 * feeds are connected and why one is not.
 *
 *   iOS  ratings      public iTunes lookup per storefront     (no credentials)
 *   iOS  reviews      ASC API customerReviews                 ASC_ISSUER_ID, ASC_KEY_ID, ASC_PRIVATE_KEY
 *   iOS  downloads    ASC API salesReports (daily SUMMARY)    + ASC_VENDOR_NUMBER
 *   iOS  sources      ASC Analytics Reports (App Downloads)   ASC key with Admin role
 *   Android listing   public Play listing (total, avg, 1–5★)   (no credentials)
 *   Android reviews   Play Developer API reviews.list          PLAY_SERVICE_ACCOUNT_JSON
 *   Android installs, ratings, reviews history, acquisition
 *                     Play bulk reports in Cloud Storage       + PLAY_REPORTS_BUCKET
 *
 * Runs daily at 04:30 UTC under a Postgres advisory lock so only one replica
 * imports; POST /api/admin/usage-stats {action:"import"} runs it on demand.
 */
import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { pool } from '@/lib/db/client'

const IOS_APP_ID = process.env.APP_STORE_APPLE_ID || '6745130824'
const ANDROID_PACKAGE = 'com.bonifatus.app'
const ASC_API = 'https://api.appstoreconnect.apple.com/v1'
const LOCK_ID = 7_300_311 // pg advisory lock key for the importer

// Every App Store storefront (ISO 3166-1 alpha-2). The iTunes lookup API is
// per-storefront, so the worldwide rating total is the sum over all of them.
export const STOREFRONTS = (
  'ae ag ai al am ao ar at au az bb be bf bg bh bj bm bn bo br bs bt bw by bz ca cg ch ci cl cm cn co cr cv cy cz ' +
  'de dk dm do dz ec ee eg es fi fj fm fr ga gb gd ge gh gm gr gt gw gy hk hn hr hu id ie il in iq is it jm jo jp ' +
  'ke kg kh kn kr kw ky kz la lb lc lk lr lt lu lv ly ma md me mg mk ml mm mn mo mr ms mt mu mv mw mx my mz na ne ' +
  'ng ni nl no np nr nz om pa pe pg ph pk pl pt pw py qa ro rs ru rw sa sb sc se sg si sk sl sn sr st sv sz tc td ' +
  'th tj tm tn to tr tt tw tz ua ug us uy uz vc ve vg vn vu ws xk ye za zm zw'
).split(' ')

// ── helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => isoDay(new Date(Date.now() - n * 86_400_000))

async function setStatus(source: string, ok: boolean, detail: string) {
  await pool.query(
    `INSERT INTO store_import_status (source, ran_at, ok, detail) VALUES ($1, NOW(), $2, $3)
     ON CONFLICT (source) DO UPDATE SET ran_at = NOW(), ok = EXCLUDED.ok, detail = EXCLUDED.detail`,
    [source, ok, String(detail || '').slice(0, 500)]
  )
}

async function putMetric(day: string, platform: string, metric: string, value: number | string) {
  if (!Number.isFinite(Number(value))) return
  await pool.query(
    `INSERT INTO store_daily (day, platform, metric, value) VALUES ($1, $2, $3, $4)
     ON CONFLICT (day, platform, metric) DO UPDATE SET value = EXCLUDED.value`,
    [day, platform, metric.slice(0, 80), Number(value)]
  )
}

interface Review {
  platform: 'ios' | 'android'
  id: string
  createdAt: Date | string
  rating: number
  territory?: string | null
  lang?: string | null
  title?: string | null
  body?: string | null
  version?: string | null
  replied?: boolean
}

async function upsertReview(r: Review) {
  await pool.query(
    `INSERT INTO store_reviews (platform, review_id, created_at, rating, territory, lang, title, body, app_version, replied)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (platform, review_id) DO UPDATE SET
       rating = EXCLUDED.rating, title = EXCLUDED.title, body = EXCLUDED.body,
       app_version = COALESCE(EXCLUDED.app_version, store_reviews.app_version),
       replied = COALESCE(EXCLUDED.replied, store_reviews.replied)`,
    [
      r.platform,
      String(r.id).slice(0, 200),
      r.createdAt,
      r.rating,
      r.territory || null,
      r.lang || null,
      r.title ? String(r.title).slice(0, 300) : null,
      r.body ? String(r.body).slice(0, 4000) : null,
      r.version || null,
      typeof r.replied === 'boolean' ? r.replied : null,
    ]
  )
}

async function getConfig(k: string, fallback: string) {
  const { rows } = await pool.query('SELECT value FROM stats_config WHERE key = $1', [k])
  return rows[0]?.value ?? fallback
}
async function setConfig(k: string, v: string) {
  await pool.query(
    `INSERT INTO stats_config (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [k, v]
  )
}

// Minimal RFC 4180 parser (quoted fields, embedded commas/newlines) → array of objects.
export function parseCsv(text: string, delimiter = ','): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  if (!rows.length) return []
  const head = rows[0].map((h) => h.replace(/^﻿/, '').trim())
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])))
}

// Play bulk reports are UTF-16LE with BOM; ASC reports are gzip UTF-8 TSV.
export function decodeText(input: Buffer): string {
  let buf = input
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf)
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString('utf16le')
  if (buf[0] === 0xfe && buf[1] === 0xff)
    return Buffer.from(buf.subarray(2)).swap16().toString('utf16le')
  return buf.toString('utf8')
}

async function fetchJson(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(30_000) })
  const text = await res.text()
  let body: Record<string, unknown> | null = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    /* non-JSON */
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, body: body as any, text }
}

/** Compact JWS (RS256 / ES256) with node:crypto — no JWT dependency needed. */
function signJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  pem: string
): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const input = `${b64(header)}.${b64(payload)}`
  const sig =
    header.alg === 'ES256'
      ? crypto.sign('sha256', Buffer.from(input), { key: pem, dsaEncoding: 'ieee-p1363' })
      : crypto.sign('sha256', Buffer.from(input), pem)
  return `${input}.${sig.toString('base64url')}`
}

// ── App Store Connect ─────────────────────────────────────────────────────────
const ascConfigured = () =>
  !!(process.env.ASC_ISSUER_ID && process.env.ASC_KEY_ID && process.env.ASC_PRIVATE_KEY)

// Accepts PEM with real or escaped newlines, or the bare base64 body.
function ascPem(): string {
  const raw = (process.env.ASC_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim().replace(/^"|"$/g, '')
  const body = raw.replace(/-----(BEGIN|END)[A-Z ]*-----/g, '').replace(/\s+/g, '')
  return `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----\n`
}

function ascToken(): string {
  const now = Math.floor(Date.now() / 1000)
  return signJwt(
    { alg: 'ES256', kid: process.env.ASC_KEY_ID, typ: 'JWT' },
    { iss: process.env.ASC_ISSUER_ID, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' },
    ascPem()
  )
}

async function asc(pathOrUrl: string, opts: RequestInit = {}) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : ASC_API + pathOrUrl
  return fetchJson(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${ascToken()}`,
      'Content-Type': 'application/json',
      ...((opts.headers as Record<string, string>) || {}),
    },
  })
}

async function ascRaw(path: string) {
  const res = await fetch(ASC_API + path, {
    headers: { Authorization: `Bearer ${ascToken()}`, Accept: 'application/a-gzip' },
    signal: AbortSignal.timeout(60_000),
  })
  return { status: res.status, buf: Buffer.from(await res.arrayBuffer()) }
}

const ascErr = (r: {
  status: number
  body: { errors?: { detail?: string }[] } | null
  text: string
}) => `HTTP ${r.status}: ${(r.body?.errors?.[0]?.detail || r.text || '').slice(0, 200)}`

// Public worldwide rating count + weighted average (stars-only ratings included —
// the ASC API only exposes written reviews). No credentials needed.
async function importIosRatings() {
  let count = 0
  let weighted = 0
  let failures = 0
  const day = daysAgo(0)
  for (const cc of STOREFRONTS) {
    try {
      const r = await fetchJson(`https://itunes.apple.com/lookup?id=${IOS_APP_ID}&country=${cc}`)
      const app = r.body?.results?.[0]
      const n = Number(app?.userRatingCount || 0)
      if (n > 0) {
        count += n
        weighted += n * Number(app.averageUserRating || 0)
        await putMetric(day, 'ios', `ratings_cc:${cc.toUpperCase()}`, n)
      }
    } catch {
      failures++
    }
    await sleep(3200) // the iTunes lookup API allows ~20 calls/min
  }
  if (failures > STOREFRONTS.length / 2)
    throw new Error(`${failures}/${STOREFRONTS.length} storefront lookups failed`)
  await putMetric(day, 'ios', 'rating_count_total', count)
  if (count) await putMetric(day, 'ios', 'rating_avg_total', (weighted / count).toFixed(3))
  return `${count} ratings across ${STOREFRONTS.length} storefronts${failures ? `, ${failures} lookups failed` : ''}`
}

async function importAscReviews() {
  let url: string | null =
    `/apps/${IOS_APP_ID}/customerReviews?limit=200&sort=-createdDate&include=response`
  let n = 0
  while (url) {
    const r = await asc(url)
    if (r.status !== 200) throw new Error(ascErr(r))
    for (const rev of r.body.data) {
      const a = rev.attributes
      await upsertReview({
        platform: 'ios',
        id: rev.id,
        createdAt: a.createdDate,
        rating: a.rating,
        territory: a.territory,
        title: a.title,
        body: a.body,
        replied: !!rev.relationships?.response?.data,
      })
      n++
    }
    url = r.body.links?.next || null
  }
  return `${n} written reviews`
}

// Product Type Identifiers (Apple "Sales and Trends" guide): first-time
// downloads, re-downloads and updates of a free iOS/universal app.
const PTI_DOWNLOAD = new Set(['1', '1F', '1T', 'F1', '1E', '1EP', '1EU'])
const PTI_REDOWNLOAD = new Set(['3', '3F', '3T', 'F3'])
const PTI_UPDATE = new Set(['7', '7F', '7T', 'F7'])

async function importAscSales() {
  const vendor = process.env.ASC_VENDOR_NUMBER
  if (!vendor) throw new Error('ASC_VENDOR_NUMBER not set')
  // Reports for day D are published on D+1; fill every missing day of the last 35.
  const { rows } = await pool.query(
    `SELECT day::text FROM store_daily WHERE platform = 'ios' AND metric = 'downloads' AND day >= $1`,
    [daysAgo(35)]
  )
  const have = new Set(rows.map((r) => r.day))
  let imported = 0
  for (let i = 35; i >= 1; i--) {
    const day = daysAgo(i)
    if (have.has(day) && i > 3) continue // re-pull the last 3 days: Apple restates late units
    const params = new URLSearchParams({
      'filter[frequency]': 'DAILY',
      'filter[reportType]': 'SALES',
      'filter[reportSubType]': 'SUMMARY',
      'filter[vendorNumber]': vendor,
      'filter[reportDate]': day,
      'filter[version]': '1_1',
    })
    const r = await ascRaw(`/salesReports?${params}`)
    if (r.status === 404) {
      // "There were no sales for the date specified" — a real zero, unless the
      // report simply isn't published yet (yesterday before ~noon PT).
      if (i > 1) await putMetric(day, 'ios', 'downloads', 0)
      continue
    }
    if (r.status !== 200)
      throw new Error(`salesReports ${day}: HTTP ${r.status} ${decodeText(r.buf).slice(0, 200)}`)
    const sums = { downloads: 0, redownloads: 0, updates: 0 }
    const byCc: Record<string, number> = {}
    for (const row of parseCsv(decodeText(r.buf), '\t')) {
      if (row['Apple Identifier'] !== IOS_APP_ID) continue
      const units = Number(row.Units) || 0
      const pti = row['Product Type Identifier']
      if (PTI_DOWNLOAD.has(pti)) {
        sums.downloads += units
        const cc = row['Country Code']
        if (cc) byCc[cc] = (byCc[cc] || 0) + units
      } else if (PTI_REDOWNLOAD.has(pti)) sums.redownloads += units
      else if (PTI_UPDATE.has(pti)) sums.updates += units
    }
    for (const [m, v] of Object.entries(sums)) await putMetric(day, 'ios', m, v)
    for (const [cc, v] of Object.entries(byCc)) await putMetric(day, 'ios', `dl_cc:${cc}`, v)
    imported++
  }
  return `${imported} daily reports`
}

// ASC Analytics Reports: one ONGOING request per app delivers daily
// "App Downloads" reports with Source Type and Campaign.
async function importAscAnalytics() {
  let r = await asc(`/apps/${IOS_APP_ID}/analyticsReportRequests?filter[accessType]=ONGOING`)
  if (r.status !== 200) throw new Error(ascErr(r))
  const reqId = r.body.data[0]?.id
  if (!reqId) {
    r = await asc('/analyticsReportRequests', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'analyticsReportRequests',
          attributes: { accessType: 'ONGOING' },
          relationships: { app: { data: { type: 'apps', id: IOS_APP_ID } } },
        },
      }),
    })
    if (r.status !== 201) throw new Error(`create report request: ${ascErr(r)}`)
    return 'ONGOING report request created — Apple delivers the first reports within ~48h'
  }
  r = await asc(`/analyticsReportRequests/${reqId}/reports?filter[category]=COMMERCE&limit=200`)
  if (r.status !== 200) throw new Error(ascErr(r))
  const report = r.body.data.find(
    (x: { attributes: { name: string } }) =>
      /download/i.test(x.attributes.name) && /standard/i.test(x.attributes.name)
  )
  if (!report)
    return `no downloads report yet (have: ${r.body.data.map((x: { attributes: { name: string } }) => x.attributes.name).join(', ') || 'none'})`

  const done = new Set<string>(JSON.parse(await getConfig('asc_analytics_done', '[]')))
  r = await asc(`/analyticsReports/${report.id}/instances?filter[granularity]=DAILY&limit=40`)
  if (r.status !== 200) throw new Error(ascErr(r))
  let processed = 0
  for (const inst of r.body.data) {
    if (done.has(inst.id)) continue
    const seg = await asc(`/analyticsReportInstances/${inst.id}/segments`)
    if (seg.status !== 200) throw new Error(ascErr(seg))
    const agg: Record<string, number> = {}
    for (const s of seg.body.data) {
      const file = await fetch(s.attributes.url, { signal: AbortSignal.timeout(60_000) })
      const rows = parseCsv(decodeText(Buffer.from(await file.arrayBuffer())), '\t')
      for (const row of rows) {
        if (row['App Apple Identifier'] && row['App Apple Identifier'] !== IOS_APP_ID) continue
        if (row['Download Type'] && !/first/i.test(row['Download Type'])) continue
        const day = row.Date
        const n = Number(row.Counts || row.Count || 0)
        if (!day || !n) continue
        const add = (k: string) => {
          agg[`${day}|${k}`] = (agg[`${day}|${k}`] || 0) + n
        }
        if (row['Source Type']) add(`src:${row['Source Type']}`)
        if (row.Campaign && row.Campaign !== '-') add(`cmp:${row.Campaign}`)
        if (row['Source Info'] && /referrer/i.test(row['Source Type'] || ''))
          add(`ref:${row['Source Info']}`)
      }
    }
    for (const [k, v] of Object.entries(agg)) {
      const i = k.indexOf('|')
      await putMetric(k.slice(0, i), 'ios', k.slice(i + 1), v)
    }
    done.add(inst.id)
    processed++
  }
  await setConfig('asc_analytics_done', JSON.stringify([...done].slice(-200)))
  return `${processed} new daily instances of "${report.attributes.name}"`
}

// ── Google Play ───────────────────────────────────────────────────────────────
interface ServiceAccount {
  client_email: string
  private_key: string
}

function playSa(): ServiceAccount | null {
  const raw = process.env.PLAY_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  // Stored base64-encoded (Swarm secrets mangle the key's \n escapes); raw JSON also works.
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw.trim(), 'base64').toString('utf8')
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('PLAY_SERVICE_ACCOUNT_JSON is not valid (base64) JSON')
  }
}

let googleToken = { value: '', exp: 0 }
async function googleAccessToken(sa: ServiceAccount) {
  if (googleToken.value && googleToken.exp > Date.now() + 60_000) return googleToken.value
  const now = Math.floor(Date.now() / 1000)
  const assertion = signJwt(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope:
        'https://www.googleapis.com/auth/androidpublisher https://www.googleapis.com/auth/devstorage.read_only',
    },
    sa.private_key
  )
  const r = await fetchJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (r.status !== 200) throw new Error(`Google OAuth: HTTP ${r.status} ${r.text.slice(0, 200)}`)
  googleToken = { value: r.body.access_token, exp: Date.now() + r.body.expires_in * 1000 }
  return googleToken.value
}

async function importPlayReviews() {
  const sa = playSa()
  if (!sa) throw new Error('PLAY_SERVICE_ACCOUNT_JSON not set')
  const token = await googleAccessToken(sa)
  let next = ''
  let n = 0
  do {
    const r = await fetchJson(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE}/reviews?maxResults=100${next ? `&token=${encodeURIComponent(next)}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (r.status !== 200) throw new Error(`reviews.list: HTTP ${r.status} ${r.text.slice(0, 200)}`)
    for (const rev of r.body?.reviews || []) {
      const c = rev.comments?.find((x: { userComment?: unknown }) => x.userComment)?.userComment
      if (!c) continue
      await upsertReview({
        platform: 'android',
        id: rev.reviewId,
        createdAt: new Date(Number(c.lastModified.seconds) * 1000),
        rating: c.starRating,
        lang: c.reviewerLanguage,
        body: c.text,
        version: c.appVersionName,
        replied: !!rev.comments?.some((x: { developerComment?: unknown }) => x.developerComment),
      })
      n++
    }
    next = r.body?.tokenPagination?.nextPageToken || ''
  } while (next)
  return `${n} reviews from the last 7 days`
}

async function gcsList(token: string, bucket: string, prefix: string) {
  const out: string[] = []
  let pageToken = ''
  do {
    const r = await fetchJson(
      `https://storage.googleapis.com/storage/v1/b/${bucket}/o?prefix=${encodeURIComponent(prefix)}${pageToken ? `&pageToken=${pageToken}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (r.status !== 200)
      throw new Error(`GCS list ${prefix}: HTTP ${r.status} ${r.text.slice(0, 200)}`)
    out.push(...(r.body.items || []).map((i: { name: string }) => i.name))
    pageToken = r.body.nextPageToken || ''
  } while (pageToken)
  return out
}

async function gcsGet(token: string, bucket: string, name: string) {
  const res = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(name)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(60_000) }
  )
  if (res.status !== 200) throw new Error(`GCS get ${name}: HTTP ${res.status}`)
  return decodeText(Buffer.from(await res.arrayBuffer()))
}

const num = (v: unknown) => {
  const n = Number(String(v || '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

async function importPlayReports() {
  const sa = playSa()
  if (!sa) throw new Error('PLAY_SERVICE_ACCOUNT_JSON not set')
  const bucket = (process.env.PLAY_REPORTS_BUCKET || '')
    .replace(/^gs:\/\//, '')
    .replace(/\/.*$/, '')
  if (!bucket) throw new Error('PLAY_REPORTS_BUCKET not set')
  const token = await googleAccessToken(sa)
  const months = [0, 1].map((k) => {
    const d = new Date()
    d.setUTCDate(1)
    d.setUTCMonth(d.getUTCMonth() - k)
    return d.toISOString().slice(0, 7).replace('-', '')
  })
  const notes: string[] = []

  for (const ym of months) {
    // Installs: daily user installs (= downloads), active devices, cumulative installs.
    try {
      const csv = await gcsGet(
        token,
        bucket,
        `stats/installs/installs_${ANDROID_PACKAGE}_${ym}_overview.csv`
      )
      for (const row of parseCsv(csv)) {
        if (!row.Date) continue
        const pairs: Record<string, string> = {
          downloads: row['Daily User Installs'],
          uninstalls: row['Daily User Uninstalls'],
          active_devices: row['Active Device Installs'],
          installs_total: row['Total User Installs'],
          updates: row['Daily Device Upgrades'],
        }
        for (const [m, v] of Object.entries(pairs)) {
          const n = num(v)
          if (n !== null) await putMetric(row.Date, 'android', m, n)
        }
      }
    } catch (e) {
      notes.push((e as Error).message)
    }

    // Ratings: daily and cumulative average (Play exports no rating count).
    try {
      const csv = await gcsGet(
        token,
        bucket,
        `stats/ratings/ratings_${ANDROID_PACKAGE}_${ym}_overview.csv`
      )
      for (const row of parseCsv(csv)) {
        if (!row.Date) continue
        const total = num(row['Total Average Rating'])
        const daily = num(row['Daily Average Rating'])
        if (total) await putMetric(row.Date, 'android', 'rating_avg_total', total)
        if (daily) await putMetric(row.Date, 'android', 'rating_avg_day', daily)
      }
    } catch (e) {
      notes.push((e as Error).message)
    }

    // Written reviews (full history, unlike the 7-day reviews API).
    try {
      const csv = await gcsGet(token, bucket, `reviews/reviews_${ANDROID_PACKAGE}_${ym}.csv`)
      for (const row of parseCsv(csv)) {
        const rating = num(row['Star Rating'])
        const millis = num(row['Review Submit Millis Since Epoch'])
        if (!rating || !millis) continue
        await upsertReview({
          platform: 'android',
          id: row['Review Link'] || `bulk:${millis}:${rating}`,
          createdAt: new Date(millis),
          rating,
          lang: row['Reviewer Language'],
          title: row['Review Title'],
          body: row['Review Text'],
          version: row['App Version Name'],
          replied:
            row['Developer Reply Text'] !== undefined ? !!row['Developer Reply Text'] : undefined,
        })
      }
    } catch (e) {
      notes.push((e as Error).message)
    }

    // Acquisition: store-listing acquisitions per channel and per UTM campaign.
    const acq = await gcsList(
      token,
      bucket,
      `acquisition/retained_installers/retained_installers_${ANDROID_PACKAGE}_${ym}_`
    ).catch((e: Error) => {
      notes.push(e.message)
      return [] as string[]
    })
    for (const name of acq) {
      const kind = /_channel\.csv$/.test(name)
        ? 'channel'
        : /_utm_tagged\.csv$/.test(name)
          ? 'utm'
          : null
      if (!kind) continue
      const agg: Record<string, number> = {}
      for (const row of parseCsv(await gcsGet(token, bucket, name))) {
        const n = num(row.Installers ?? row['Store listing acquisitions'])
        if (!row.Date || !n) continue
        const label =
          kind === 'channel'
            ? `src:${row['Acquisition Channel'] || 'Other'}`
            : `cmp:${[row['UTM Source'], row['UTM Campaign']].filter(Boolean).join('/') || '(none)'}`
        agg[`${row.Date}|${label}`] = (agg[`${row.Date}|${label}`] || 0) + n
      }
      for (const [k, v] of Object.entries(agg)) {
        const i = k.indexOf('|')
        await putMetric(k.slice(0, i), 'android', k.slice(i + 1), v)
      }
    }
  }
  // A report for the current month may not exist on the 1st — only fail if nothing worked.
  if (notes.length >= 6) throw new Error(notes.slice(0, 3).join(' | '))
  return notes.length ? `partial: ${notes.slice(0, 2).join(' | ')}` : `months ${months.join(', ')}`
}

/**
 * Public Google Play listing: the store's own rating total, average and 1–5★
 * histogram (the APIs expose neither the count nor the histogram). Parsed
 * strictly: the JSON-LD SoftwareApplication block must be present or the run
 * fails loudly instead of storing a wrong number. Play shows no aggregate
 * rating until an app has enough ratings — that is recorded as 0, not an error.
 */
export function parsePlayListing(html: string) {
  const blocks = [
    ...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ]
    .map((m) => {
      try {
        return JSON.parse(m[1])
      } catch {
        return null
      }
    })
    .filter((j) => j && j['@type'] === 'SoftwareApplication')
  if (!blocks.length) throw new Error('Play listing format changed: no SoftwareApplication JSON-LD')
  const agg = blocks[0].aggregateRating
  const histogram: Record<string, number> = {}
  for (const m of html.matchAll(/aria-label="([\d,.]+) reviews? for star rating ([1-5])"/g)) {
    histogram[m[2]] = Number(m[1].replace(/[,.]/g, ''))
  }
  return {
    name: blocks[0].name as string,
    count: agg ? Number(agg.ratingCount) : 0,
    avg: agg ? Number(agg.ratingValue) : null,
    histogram,
  }
}

async function importPlayListing() {
  const res = await fetch(
    `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&hl=en&gl=US`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
        'Accept-Language': 'en-US',
      },
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (res.status !== 200) throw new Error(`Play listing HTTP ${res.status}`)
  const r = parsePlayListing(await res.text())
  const day = daysAgo(0)
  await putMetric(day, 'android', 'rating_count_total', r.count)
  if (r.avg !== null) await putMetric(day, 'android', 'rating_avg_total', r.avg)
  for (const [star, n] of Object.entries(r.histogram))
    await putMetric(day, 'android', `hist:${star}`, n)
  return r.count
    ? `${r.count} ratings, ★${r.avg!.toFixed(2)}`
    : 'listing OK — no public rating yet (Play shows it after enough ratings)'
}

// ── orchestration ─────────────────────────────────────────────────────────────
type Ready = true | string
export const SOURCES: { id: string; needs: () => Ready; run: () => Promise<string> }[] = [
  {
    id: 'play_listing',
    needs: () => true,
    run: importPlayListing,
  },
  {
    id: 'play_reviews',
    needs: () => !!process.env.PLAY_SERVICE_ACCOUNT_JSON || 'PLAY_SERVICE_ACCOUNT_JSON',
    run: importPlayReviews,
  },
  {
    id: 'play_reports',
    needs: () =>
      (!!process.env.PLAY_SERVICE_ACCOUNT_JSON && !!process.env.PLAY_REPORTS_BUCKET) ||
      'PLAY_SERVICE_ACCOUNT_JSON + PLAY_REPORTS_BUCKET',
    run: importPlayReports,
  },
  {
    id: 'asc_reviews',
    needs: () => ascConfigured() || 'ASC_ISSUER_ID + ASC_KEY_ID + ASC_PRIVATE_KEY',
    run: importAscReviews,
  },
  {
    id: 'asc_sales',
    needs: () =>
      (ascConfigured() && !!process.env.ASC_VENDOR_NUMBER) || 'ASC key + ASC_VENDOR_NUMBER',
    run: importAscSales,
  },
  {
    id: 'asc_analytics',
    needs: () => ascConfigured() || 'ASC key (Admin role)',
    run: importAscAnalytics,
  },
  // Last: ~10 minutes (≈20 lookups/min across ~175 storefronts).
  { id: 'ios_ratings', needs: () => true, run: importIosRatings },
]

let running = false

export async function runImports({ only }: { only?: string[] } = {}) {
  if (running) return { skipped: 'already running' }
  running = true
  const client = await pool.connect()
  try {
    const { rows } = await client.query('SELECT pg_try_advisory_lock($1) AS got', [LOCK_ID])
    if (!rows[0].got) return { skipped: 'another replica is importing' }
    const results: Record<string, string> = {}
    try {
      for (const s of SOURCES) {
        if (only && !only.includes(s.id)) continue
        const ready = s.needs()
        if (ready !== true) {
          await setStatus(s.id, false, `not configured — needs ${ready}`)
          results[s.id] = 'not configured'
          continue
        }
        try {
          const detail = await s.run()
          await setStatus(s.id, true, detail)
          results[s.id] = detail
        } catch (err) {
          const msg = (err as Error).message
          console.error(`[store-import] ${s.id}:`, msg)
          await setStatus(s.id, false, msg)
          results[s.id] = `error: ${msg}`
        }
      }
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID])
    }
    console.log('[store-import] done', JSON.stringify(results))
    return results
  } finally {
    client.release()
    running = false
  }
}

/**
 * Daily at 04:30 UTC; also once ~2 min after boot if the last run is >20 h old
 * (deploys must not skip a night, and must not re-import on every restart).
 */
export function startStoreImports() {
  const scheduleNext = () => {
    const now = new Date()
    const next = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 4, 30)
    )
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
    setTimeout(() => {
      runImports()
        .catch(() => {})
        .finally(scheduleNext)
    }, next.getTime() - now.getTime())
  }
  scheduleNext()
  setTimeout(async () => {
    try {
      const { rows } = await pool.query('SELECT MAX(ran_at) AS last FROM store_import_status')
      const last = rows[0]?.last ? new Date(rows[0].last).getTime() : 0
      if (Date.now() - last > 20 * 3600_000) await runImports()
    } catch (err) {
      console.error('[store-import] boot check:', (err as Error).message)
    }
  }, 2 * 60_000)
}
