#!/usr/bin/env node
// Live SEO/i18n contract check. Crawls robots.txt + sitemap.xml of a running deployment
// and verifies every indexable URL. Runs after each production deploy (deploy-web.yml)
// and locally against `next start`.
//
//   node scripts/seo-check.mjs https://bonifatus.com
//   node scripts/seo-check.mjs http://localhost:3100 --site https://bonifatus.com
//
// --site is the origin the pages advertise in canonicals/sitemap (defaults to the base).

const args = process.argv.slice(2)
const base = (args.find((a) => !a.startsWith('--')) ?? '').replace(/\/+$/, '')
const siteIdx = args.indexOf('--site')
const site = (siteIdx >= 0 ? args[siteIdx + 1] : base).replace(/\/+$/, '')
if (!base) {
  console.error('usage: node scripts/seo-check.mjs <baseUrl> [--site <origin>]')
  process.exit(2)
}

const LOCALES = ['en', 'de', 'fr', 'it', 'es', 'ru']
const failures = []
const fail = (msg) => failures.push(msg)
const toBase = (url) => (url.startsWith(site) ? base + url.slice(site.length) : url)

async function get(path, headers = {}) {
  const res = await fetch(path.startsWith('http') ? path : base + path, {
    redirect: 'manual',
    headers: { 'user-agent': 'bonifatus-seo-check', ...headers },
  })
  return { res, body: res.status === 200 ? await res.text() : '' }
}

function attr(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1]
}

function parseHead(html) {
  const head = html.split('</head>')[0]
  const links = [...head.matchAll(/<link [^>]*>/gi)].map((m) => m[0])
  const canonical = links.filter((l) => attr(l, 'rel') === 'canonical').map((l) => attr(l, 'href'))
  const alternates = Object.fromEntries(
    links
      .filter((l) => attr(l, 'rel') === 'alternate' && attr(l, 'hreflang'))
      .map((l) => [attr(l, 'hreflang'), attr(l, 'href')])
  )
  const robots = [...head.matchAll(/<meta [^>]*name="robots"[^>]*>/gi)].map((m) =>
    attr(m[0], 'content')
  )
  return {
    lang: html.match(/<html[^>]* lang="([^"]+)"/i)?.[1],
    canonical,
    alternates,
    robots,
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(
      (m) => m[1]
    ),
  }
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc>(.*?)<\/loc>/)[1],
    lastmod: block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
    alternates: Object.fromEntries(
      [...block.matchAll(/<xhtml:link[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g)].map((m) => [
        m[1],
        m[2],
      ])
    ),
  }))
}

const sameSet = (a, b) =>
  JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort())

async function checkRobots() {
  const { res, body } = await get('/robots.txt')
  if (res.status !== 200) return fail(`/robots.txt → ${res.status}`)
  if (!body.includes(`Sitemap: ${site}/sitemap.xml`))
    fail('/robots.txt does not reference the sitemap')
  for (const l of LOCALES) {
    if (!body.includes(`Disallow: /${l}/dashboard`))
      fail(`/robots.txt does not disallow /${l}/dashboard`)
  }
}

async function checkSitemap() {
  const { res, body } = await get('/sitemap.xml')
  if (res.status !== 200) {
    fail(`/sitemap.xml → ${res.status}`)
    return []
  }
  const entries = parseSitemap(body)
  if (entries.length === 0) fail('/sitemap.xml has no URLs')
  return entries
}

async function checkPage(entry, locs) {
  const url = entry.loc
  const locale = url.slice(site.length).split('/')[1]
  if (!LOCALES.includes(locale)) return fail(`${url}: sitemap URL without locale prefix`)
  if (!entry.lastmod || !/^\d{4}-\d{2}-\d{2}/.test(entry.lastmod))
    fail(`${url}: missing/invalid lastmod`)

  const { res, body } = await get(toBase(url))
  if (res.status !== 200)
    return fail(
      `${url} → ${res.status}${res.headers.get('location') ? ' → ' + res.headers.get('location') : ''}`
    )

  const head = parseHead(body)
  if (head.lang !== locale) fail(`${url}: <html lang="${head.lang}">, expected "${locale}"`)
  if (head.canonical.length !== 1 || head.canonical[0] !== url)
    fail(`${url}: canonical ${JSON.stringify(head.canonical)}`)
  if (head.robots.some((r) => /noindex/i.test(r ?? '')))
    fail(`${url}: listed in sitemap but noindex`)
  if (!head.alternates[locale] || head.alternates[locale] !== url)
    fail(`${url}: hreflang does not include itself`)
  if (!head.alternates['x-default']) fail(`${url}: no x-default hreflang`)
  if (!sameSet(head.alternates, entry.alternates))
    fail(`${url}: HTML hreflang differs from sitemap`)
  for (const [lang, href] of Object.entries(head.alternates)) {
    if (!locs.has(href)) fail(`${url}: hreflang ${lang} → ${href} is not an indexable sitemap URL`)
  }
  if (head.jsonLd.some((j) => j.includes('aggregateRating')))
    fail(`${url}: JSON-LD contains aggregateRating`)
  for (const j of head.jsonLd) {
    try {
      JSON.parse(j)
    } catch {
      fail(`${url}: invalid JSON-LD`)
    }
  }
  return head
}

async function checkRouting() {
  const expectRedirect = async (path, headers, target) => {
    const { res } = await get(path, headers)
    const loc = res.headers.get('location')
    const pathOnly = loc ? new URL(loc, base).pathname + new URL(loc, base).search : null
    if (![301, 302, 303, 307, 308].includes(res.status) || pathOnly !== target) {
      fail(
        `${path} ${JSON.stringify(headers)} → ${res.status} ${loc}, expected redirect to ${target}`
      )
    }
    return res
  }
  const root = await expectRedirect('/', { 'accept-language': 'de-DE,de;q=0.9' }, '/de')
  if (!/accept-language/i.test(root.headers.get('vary') ?? ''))
    fail('/ redirect lacks Vary: Accept-Language')
  await expectRedirect('/', {}, '/en')
  await expectRedirect('/faq', { cookie: 'NEXT_LOCALE=fr', 'accept-language': 'de' }, '/fr/faq')
  await expectRedirect('/de/parent/children', {}, '/de/login?redirectTo=%2Fparent%2Fchildren')

  for (const path of [
    '/de/diese-seite-gibt-es-nicht',
    '/en/no-such-page',
    '/de/tools/no-such-tool',
  ]) {
    const { res } = await get(path)
    if (res.status !== 404) fail(`${path} → ${res.status}, expected 404`)
  }

  const { res: en } = await get('/en/faq', { 'accept-language': 'de' })
  if (en.status !== 200)
    fail(`/en/faq with German browser → ${en.status}, expected 200 (no forced redirect)`)
}

async function checkStructuredData(heads) {
  for (const path of [
    '/en',
    '/de',
    '/en/tools/grade-reward-calculator',
    '/de/tools/grade-reward-calculator',
  ]) {
    const head = heads.get(site + path)
    if (!head) continue
    const graph = head.jsonLd.map((j) => JSON.parse(j)).flatMap((d) => d['@graph'] ?? [d])
    const app = graph.find((n) => n['@type'] === 'WebApplication')
    if (!app) fail(`${site}${path}: no WebApplication JSON-LD`)
    else if (app.offers?.price !== '0') fail(`${site}${path}: WebApplication offer is not free`)
    if (!graph.some((n) => n['@type'] === 'Organization'))
      fail(`${site}${path}: no Organization JSON-LD`)
  }
}

async function pool(items, size, fn) {
  const results = []
  let i = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const item = items[i++]
        results.push([item, await fn(item)])
      }
    })
  )
  return results
}

await checkRobots()
const entries = await checkSitemap()
const locs = new Set(entries.map((e) => e.loc))
const heads = new Map(
  (await pool(entries, 6, (e) => checkPage(e, locs))).map(([e, head]) => [e.loc, head])
)
await checkRouting()
await checkStructuredData(heads)

console.log(`Checked ${entries.length} sitemap URLs on ${base} (site ${site}).`)
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('All SEO/i18n checks passed.')
