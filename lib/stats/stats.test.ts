import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/client', () => ({ pool: { query: vi.fn() } }))
vi.mock('@/lib/auth/session', () => ({ requireAuthApi: vi.fn() }))

import {
  acquisitionOf,
  cleanInstallId,
  cleanProps,
  cleanScreen,
  countryOf,
  platformOf,
  referrerHost,
  trafficOf,
  webTraffic,
} from '@/lib/stats/usage'
import { bucketStart, rangeWindow } from '@/lib/stats/aggregate'
import { normLocal } from '@/lib/stats/classify'
import { outcomeOf } from '@/lib/stats/with-action-log'
import { decodeText, parseCsv, parsePlayListing } from '@/lib/stats/store-import'
import {
  createLoginLink,
  generateOtp,
  generateSession,
  isAllowedEmail,
  LINK_SESSION_TTL_SEC,
  redeemLoginLink,
  validateOtp,
  validateSession,
} from '@/lib/stats/admin-auth'
import { pool } from '@/lib/db/client'

const h = (o: Record<string, string>) => new Headers(o)

describe('web traffic classes', () => {
  const chrome =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'

  it('starts anonymous browsers as unengaged, signed-in people as real', () => {
    expect(webTraffic(h({ 'user-agent': chrome }))).toBe('unengaged')
    expect(webTraffic(h({ 'user-agent': chrome }), { userId: 'u1' })).toBeNull()
  })

  it('recognises crawlers, link previews, scripts and automation', () => {
    for (const ua of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'facebookexternalhit/1.1',
      'WhatsApp/2.23',
      'curl/8.4.0',
      'python-requests/2.31',
      'Mozilla/5.0 HeadlessChrome/130.0',
    ])
      expect(webTraffic(h({ 'user-agent': ua }), { userId: 'u1' })).toBe('bot')
    expect(webTraffic(h({}))).toBe('bot')
    expect(webTraffic(h({ 'user-agent': chrome }), { webdriver: true })).toBe('bot')
  })
})

describe('usage sanitizers', () => {
  it('only accepts allow-listed prop keys with short enum values', () => {
    expect(
      cleanProps({ source: 'scan_button', note: 'Max hat eine 1', mode: 'Hello World', count: 3 })
    ).toEqual({ source: 'scan_button', count: 3 })
    expect(cleanProps(['x'])).toBeNull()
    expect(cleanProps({ note: 'free text' })).toBeNull()
  })

  it('strips query strings and odd characters from screens', () => {
    expect(cleanScreen('/de/parent/children?child=abc#x')).toBe('/de/parent/children')
    expect(cleanScreen('/student/<script>')).toBe('/student/script')
    expect(cleanScreen('')).toBeNull()
  })

  it('accepts the app device id and UUIDs as install ids', () => {
    expect(cleanInstallId('0a1b2c3d4e5f6a7b')).toBe('0a1b2c3d4e5f6a7b')
    expect(cleanInstallId('6F9619FF-8B86-D011-B42D-00C04FC964FF')).toBe(
      '6f9619ff-8b86-d011-b42d-00c04fc964ff'
    )
    expect(cleanInstallId('someone@example.com')).toBeNull()
  })

  it('derives platform from headers', () => {
    expect(platformOf(h({ 'x-platform': 'ios' }))).toBe('ios')
    expect(platformOf(h({ 'x-mobile-client-token': 'a:1:b' }))).toBe('app')
    expect(platformOf(h({ authorization: 'Bearer x' }))).toBe('app')
    expect(platformOf(h({ authorization: 'Bearer x', origin: 'https://bonifatus.com' }))).toBe(
      'web'
    )
    expect(platformOf(h({}))).toBe('web')
  })

  it('keeps only real country codes', () => {
    expect(countryOf(h({ 'cf-ipcountry': 'de' }))).toBe('DE')
    expect(countryOf(h({ 'cf-ipcountry': 'XX' }))).toBeNull()
    expect(countryOf(h({}))).toBeNull()
  })

  it('reduces referrers to a foreign host', () => {
    expect(referrerHost('https://www.google.com/search?q=noten')).toBe('google.com')
    expect(referrerHost('https://dev.bonifatus.com/de')).toBeNull()
    expect(referrerHost('not a url')).toBeNull()
    expect(acquisitionOf({ acq: { referrer: 'https://pinterest.com/pin/1' } })).toEqual({
      source: 'pinterest.com',
      medium: 'referral',
      campaign: null,
    })
    expect(acquisitionOf({ acq: { utm_source: 'Newsletter', utm_campaign: 'herbst' } })).toEqual({
      source: 'newsletter',
      medium: null,
      campaign: 'herbst',
    })
  })

  it('maps HTTP status to outcome', () => {
    expect(outcomeOf(200)).toBe('ok')
    expect(outcomeOf(400)).toBe('invalid')
    expect(outcomeOf(401)).toBe('denied')
    expect(outcomeOf(404)).toBe('not_found')
    expect(outcomeOf(429)).toBe('rate_limited')
    expect(outcomeOf(500)).toBe('fail')
  })
})

describe('store import parsers', () => {
  const rated = `<html><script type="application/ld+json" nonce="x">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Bonifatus","aggregateRating":{"@type":"AggregateRating","ratingValue":"4.6","ratingCount":"1234"}}</script>
    <div aria-label="1,000 reviews for star rating 5"></div><div aria-label="34 reviews for star rating 1"></div></html>`
  const unrated = `<html><script type="application/ld+json">{"@type":"SoftwareApplication","name":"Bonifatus"}</script></html>`

  it('reads the Play total, average and histogram', () => {
    expect(parsePlayListing(rated)).toEqual({
      name: 'Bonifatus',
      count: 1234,
      avg: 4.6,
      histogram: { '5': 1000, '1': 34 },
      installs: null,
    })
  })

  it('records an unrated listing as zero', () => {
    expect(parsePlayListing(unrated)).toEqual({
      name: 'Bonifatus',
      count: 0,
      avg: null,
      histogram: {},
      installs: null,
    })
  })

  it('takes the exact install count only from the triple of the visible bucket', () => {
    const html = (body: string) => `${unrated}${body}`
    expect(
      parsePlayListing(html('<div>10+</div><div class="x">Downloads</div> ["10+",10,16]')).installs
    ).toEqual({ bucket: '10+', exact: 16 })
    expect(
      parsePlayListing(html('<div>10+</div><div class="x">Downloads</div> ["50+",50,77]')).installs
    ).toEqual({ bucket: '10+', exact: null })
  })

  it('fails loudly when the listing format changes', () => {
    expect(() => parsePlayListing('<html>no json-ld</html>')).toThrow(/format changed/)
  })

  it('parses quoted CSV and UTF-16 bulk reports', () => {
    expect(parseCsv('a,b\n"x, y","he said ""hi"""\n')).toEqual([{ a: 'x, y', b: 'he said "hi"' }])
    const utf16 = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from('Date,N\r\n2026-10-01,5', 'utf16le'),
    ])
    expect(parseCsv(decodeText(utf16))).toEqual([{ Date: '2026-10-01', N: '5' }])
  })
})

describe('admin OTP auth', () => {
  const owner = 'owner@example.com'
  const tagOf = (state: string) => state.split('.')[1]

  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret'
    process.env.STATS_ADMIN_EMAILS = `${owner}, second@example.org`
  })

  it('accepts the emailed code only with its own cookie state', () => {
    const { code, state } = generateOtp(owner)
    expect(validateOtp(code, state)).toBe(tagOf(state))
    const wrong = code === '123456' ? '654321' : '123456'
    expect(validateOtp(wrong, state)).toBeNull()
    expect(validateOtp(code, null)).toBeNull()
    const [, tag, mac] = state.split('.')
    expect(validateOtp(code, `${Math.floor(Date.now() / 1000) - 1}.${tag}.${mac}`)).toBeNull()
  })

  it('never opens a session for an address off the allow-list, even with the right code', () => {
    const { code, state } = generateOtp('stranger@example.com')
    expect(validateOtp(code, state)).toBeNull()
  })

  it('signs sessions that cannot be forged or extended', () => {
    const s = generateSession(tagOf(generateOtp(owner).state))
    expect(validateSession(s)).toBe(true)
    const [exp, tag, mac] = s.split('.')
    expect(validateSession(`${Number(exp) + 3600}.${tag}.${mac}`)).toBe(false)
    expect(validateSession('garbage')).toBe(false)
  })

  it('revokes a session as soon as its address leaves the allow-list', () => {
    const s = generateSession(tagOf(generateOtp('second@example.org').state))
    expect(validateSession(s)).toBe(true)
    process.env.STATS_ADMIN_EMAILS = owner
    expect(validateSession(s)).toBe(false)
  })

  it('caps a session at twelve hours and links at one', () => {
    const tag = tagOf(generateOtp(owner).state)
    const left = (s: string) => Number(s.split('.')[0]) - Math.floor(Date.now() / 1000)
    expect(left(generateSession(tag, 999_999))).toBeLessThanOrEqual(12 * 3600)
    expect(left(generateSession(tag, LINK_SESSION_TTL_SEC))).toBeLessThanOrEqual(3600)
  })

  it('allows only addresses from the STATS_ADMIN_EMAILS secret', () => {
    delete process.env.STATS_ADMIN_EMAILS
    expect(isAllowedEmail('owner@example.com')).toBe(false)
    process.env.STATS_ADMIN_EMAILS = 'owner@example.com, second@example.org'
    expect(isAllowedEmail(' Owner@Example.com ')).toBe(true)
    expect(isAllowedEmail('second@example.org')).toBe(true)
    expect(isAllowedEmail('owner+x@example.com')).toBe(false)
    expect(isAllowedEmail('')).toBe(false)
  })
})

describe('one-time sign-in links', () => {
  const query = vi.mocked(pool.query) as unknown as ReturnType<typeof vi.fn>

  it('stores only the hash of a random 256-bit token', async () => {
    query.mockReset().mockResolvedValue({ rows: [], rowCount: 1 })
    const { token, expiresIn } = await createLoginLink()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(expiresIn).toBe(600)
    const [, params] = query.mock.calls[0]
    expect(params[0]).toMatch(/^[0-9a-f]{64}$/)
    expect(params[0]).not.toContain(token)
  })

  it('redeems only once and rejects malformed tokens without a query', async () => {
    process.env.AUTH_SECRET = 'test-secret'
    process.env.STATS_ADMIN_EMAILS = 'owner@example.com'
    query.mockReset()
    expect(await redeemLoginLink('short')).toBeNull()
    expect(await redeemLoginLink("x'; DROP TABLE users; --".padEnd(43, 'x'))).toBeNull()
    expect(query).not.toHaveBeenCalled()

    const token = 'a'.repeat(43)
    query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 })
    const tag = await redeemLoginLink(token)
    expect(validateSession(generateSession(tag!))).toBe(true)
    expect(await redeemLoginLink(token)).toBeNull()
    expect(String(query.mock.calls[0][0])).toMatch(/used_at IS NULL AND expires_at > NOW\(\)/)
  })
})

describe('periods', () => {
  const now = new Date('2026-10-31T15:00:00Z')
  const span = (range: string, o: { at?: string; from?: string; to?: string } = {}) => {
    const w = rangeWindow(range, o, now)
    const d = (x: Date) => x.toISOString().slice(0, 10)
    return [d(w.from), d(w.to), w.days, d(w.prevFrom), d(w.prevTo)]
  }

  it('resolves rolling periods to whole UTC days, with an equally long previous period', () => {
    expect(span('7d')).toEqual(['2026-10-25', '2026-11-01', 7, '2026-10-18', '2026-10-25'])
    expect(span('30d')).toEqual(['2026-10-02', '2026-11-01', 30, '2026-09-02', '2026-10-02'])
    expect(span('12m')[2]).toBe(365)
  })

  it('anchors calendar periods on any past day, never past today', () => {
    expect(span('day')).toEqual(['2026-10-31', '2026-11-01', 1, '2026-10-30', '2026-10-31'])
    expect(span('day', { at: '2026-10-30' }).slice(0, 2)).toEqual(['2026-10-30', '2026-10-31'])
    expect(span('day', { at: '2027-01-01' }).slice(0, 2)).toEqual(['2026-10-31', '2026-11-01'])
    // 2026-10-14 is a Wednesday: Monday to Sunday around it.
    expect(span('week', { at: '2026-10-14' })).toEqual([
      '2026-10-12',
      '2026-10-19',
      7,
      '2026-10-05',
      '2026-10-12',
    ])
  })

  it('compares an unfinished period with the same stretch of the one before', () => {
    // Saturday 31 Oct: six days of this week against the first six of last week.
    expect(span('week')).toEqual(['2026-10-26', '2026-11-01', 6, '2026-10-19', '2026-10-25'])
    const mid = rangeWindow('month', {}, new Date('2026-10-10T12:00:00Z'))
    expect(mid.days).toBe(10)
    expect(mid.prevFrom.toISOString().slice(0, 10)).toBe('2026-09-01')
    expect(mid.prevTo.toISOString().slice(0, 10)).toBe('2026-09-11')
  })

  it('compares the month before, and the same dates last year for year to date', () => {
    expect(span('month', { at: '2026-09-15' })).toEqual([
      '2026-09-01',
      '2026-10-01',
      30,
      '2026-08-01',
      '2026-08-31',
    ])
    expect(span('ytd')).toEqual(['2026-01-01', '2026-11-01', 304, '2025-01-01', '2025-11-01'])
  })

  it('accepts custom days in either order, never past today, at most 400 days', () => {
    expect(span('custom', { from: '2026-10-20', to: '2026-10-10' }).slice(0, 3)).toEqual([
      '2026-10-10',
      '2026-10-21',
      11,
    ])
    expect(span('custom', { from: '2026-10-30', to: '2027-01-01' }).slice(0, 2)).toEqual([
      '2026-10-30',
      '2026-11-01',
    ])
    expect(span('custom', { from: '2020-01-01', to: '2026-10-31' })[2]).toBe(400)
    expect(span('custom', { from: 'nonsense', to: '2026-10-31' }).slice(0, 3)).toEqual([
      '2026-10-25',
      '2026-11-01',
      7,
    ])
  })

  it('buckets days into Monday weeks and calendar months', () => {
    expect(bucketStart('2026-10-31', 'day')).toBe('2026-10-31')
    expect(bucketStart('2026-10-31', 'week')).toBe('2026-10-26') // Saturday → Monday
    expect(bucketStart('2026-10-26', 'week')).toBe('2026-10-26')
    expect(bucketStart('2026-11-01', 'week')).toBe('2026-10-26') // Sunday → previous Monday
    expect(bucketStart('2026-10-31', 'month')).toBe('2026-10-01')
  })
})

describe('real-user detection', () => {
  it('recognises Apple review, Test Lab devices and the team browser by request', () => {
    expect(trafficOf(h({ 'cf-connecting-ip': '17.58.100.4' }))).toBe('review')
    expect(trafficOf(h({ 'cf-connecting-ip': '108.177.6.20' }))).toBe('test')
    expect(trafficOf(h({ 'cf-connecting-ip': '2001:4860:1008::42' }))).toBe('test')
    expect(trafficOf(h({ 'cf-connecting-ip': '139.178.131.68' }))).toBe('review')
    expect(trafficOf(h({ 'cf-connecting-ip': '66.249.88.23' }))).toBe('test')
    expect(trafficOf(h({ 'cf-connecting-ip': '74.125.210.9' }))).toBe('test')
    expect(trafficOf(h({ 'cf-connecting-ip': '139.178.64.1' }))).toBeNull()
    expect(
      trafficOf(h({ 'cf-connecting-ip': '84.150.1.2', cookie: 'a=b; bstats_internal=1' }))
    ).toBe('internal')
    expect(trafficOf(h({ 'cf-connecting-ip': '84.150.1.2', 'x-internal': '1' }))).toBe('internal')
    expect(trafficOf(h({ 'cf-connecting-ip': '17.58.100.4', 'x-internal': '1' }))).toBe('internal')
    expect(trafficOf(h({ 'cf-connecting-ip': '84.150.1.2', 'x-internal': '0' }))).toBeNull()
    expect(trafficOf(h({ 'cf-connecting-ip': '84.150.1.2' }))).toBeNull()
    expect(trafficOf(h({ 'cf-connecting-ip': '170.1.1.1' }))).toBeNull()
  })

  it('normalises addresses so the team is found across aliases and domains', () => {
    expect(normLocal('Alexander.Perel+Maxim@gmail.com')).toBe('alexanderperel')
    expect(normLocal('alexanderperel@yahoo.com')).toBe('alexanderperel')
  })
})
