/**
 * Google Search Console on /admin/stats: the pages we watch, and the dashboard
 * query over what lib/stats/store-import.ts imports nightly (migration 0027).
 */
import { PRODUCTION_URL } from '@/lib/site'
import { PUBLIC_PAGES, pageLocales } from '@/lib/seo/routes'
import { int, q } from '@/lib/stats/sql'

/** The calculators that the Ratgeber links to (growth plan B3/B4). */
const TRACKED_TOOLS = new Set([
  '/tools/grade-reward-calculator',
  '/tools/zeugnisgeld-rechner',
  '/tools/notendurchschnitt-rechner',
])

/** Paths whose index status is checked every night: every Ratgeber page and its calculators. */
export const isTrackedPath = (path: string) =>
  path === '/ratgeber' || path.startsWith('/ratgeber/') || TRACKED_TOOLS.has(path)

/** Absolute production URLs of the tracked pages, in each locale the page exists in. */
export function trackedPageUrls(): string[] {
  return PUBLIC_PAGES.filter((p) => isTrackedPath(p.path)).flatMap((p) =>
    pageLocales(p).map((l) => `${PRODUCTION_URL}/${l}${p.path}`)
  )
}

export async function searchConsole(w: { from: Date; to: Date }) {
  const tracked = trackedPageUrls()
  const [pages, totals, index, status] = await Promise.all([
    q(
      `SELECT page, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
              SUM(position_sum) / NULLIF(SUM(impressions), 0) AS position
         FROM gsc_pages WHERE day >= $1::date AND day < $2::date GROUP BY page`,
      [w.from, w.to]
    ),
    q(
      `SELECT SUM(clicks) AS clicks, SUM(impressions) AS impressions,
              SUM(position_sum) / NULLIF(SUM(impressions), 0) AS position, MAX(day)::text AS last_day
         FROM gsc_pages WHERE day >= $1::date AND day < $2::date`,
      [w.from, w.to]
    ),
    q(`SELECT page, checked_at, verdict, coverage, last_crawl FROM gsc_index`),
    q(`SELECT ok, detail, ran_at FROM store_import_status WHERE source = 'search_console'`),
  ])
  const perf = new Map(pages.map((r) => [String(r.page).replace(/\/+$/, ''), r]))
  const idx = new Map(index.map((r) => [String(r.page), r]))
  const rows = tracked.map((url) => {
    const r = perf.get(url.replace(/\/+$/, ''))
    const i = idx.get(url)
    return {
      url,
      page: url.replace(PRODUCTION_URL, ''),
      clicks: int(r?.clicks),
      impressions: int(r?.impressions),
      position: r?.position == null ? null : Math.round(Number(r.position) * 10) / 10,
      verdict: (i?.verdict as string) ?? null,
      coverage: (i?.coverage as string) ?? null,
      lastCrawl: i?.last_crawl ? new Date(i.last_crawl as string).toISOString() : null,
      checkedAt: i?.checked_at ? new Date(i.checked_at as string).toISOString() : null,
    }
  })
  rows.sort(
    (a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.page.localeCompare(b.page)
  )
  const t = totals[0] ?? {}
  return {
    connected: !!status[0]?.ok,
    status: status[0]
      ? { ok: !!status[0].ok, detail: String(status[0].detail ?? ''), ranAt: status[0].ran_at }
      : null,
    site: {
      clicks: int(t.clicks),
      impressions: int(t.impressions),
      position: t.position == null ? null : Math.round(Number(t.position) * 10) / 10,
      lastDay: (t.last_day as string) ?? null,
    },
    rows,
  }
}
