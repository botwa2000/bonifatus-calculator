import { describe, expect, it } from 'vitest'
import {
  ACTIVATION_STEPS,
  denialLabel,
  denialReason,
  entryPath,
  shapeActivation,
  shapeArticlePath,
  shapeDenials,
  trackedLandingTotal,
  type StepId,
} from '@/lib/stats/funnel'
import { isTrackedPath, trackedPageUrls } from '@/lib/stats/search-console'

describe('denialReason', () => {
  it('prefers the logged reason', () => {
    expect(denialReason('wrong_password', 'denied')).toBe('wrong_password')
  })
  it('falls back on what the outcome tells', () => {
    expect(denialReason(null, 'rate_limited')).toBe('rate_limited')
    expect(denialReason(null, 'fail')).toBe('server_error')
    expect(denialReason(null, 'denied')).toBe('unrecorded')
    expect(denialReason('', 'denied')).toBe('unrecorded')
  })
  it('labels known and unknown reasons', () => {
    expect(denialLabel('email_unverified')).toBe('Email not confirmed yet')
    expect(denialLabel('some_new_reason')).toBe('some new reason')
  })
})

describe('shapeDenials', () => {
  const days = ['2026-11-01', '2026-11-02']
  const d = shapeDenials(
    days,
    [
      {
        day: '2026-11-01',
        provider: 'password',
        reason: 'wrong_password',
        outcome: 'denied',
        n: 3,
      },
      { day: '2026-11-01', provider: 'google', reason: 'token_invalid', outcome: 'denied', n: 1 },
      { day: '2026-11-02', provider: 'password', reason: null, outcome: 'rate_limited', n: 2 },
      {
        day: '2026-11-02',
        provider: 'password',
        reason: 'wrong_password',
        outcome: 'denied',
        n: 1,
      },
      { day: '2026-11-02', provider: 'apple', reason: 'no_email', outcome: 'denied', n: 1 },
    ],
    [
      { provider: 'password', ok: 4, refused: 6, people: 3, stuck: 1 },
      { provider: 'google', ok: 9, refused: 1, people: 1, stuck: 0 },
    ]
  )
  it('fills every day of the range, split by method', () => {
    expect(d.days).toEqual([
      { day: '2026-11-01', password: 3, google: 1, apple: 0 },
      { day: '2026-11-02', password: 3, google: 0, apple: 1 },
    ])
  })
  it('ranks reasons with a per-method split', () => {
    expect(d.reasons[0]).toMatchObject({ reason: 'wrong_password', total: 4, password: 4 })
    expect(d.reasons.find((r) => r.reason === 'rate_limited')?.total).toBe(2)
    expect(d.reasons.find((r) => r.reason === 'no_email')).toMatchObject({ apple: 1, total: 1 })
  })
  it('gives attempts and refusal share per method, zero when unused', () => {
    expect(d.providers).toEqual([
      {
        provider: 'password',
        attempts: 10,
        ok: 4,
        refused: 6,
        refusedShare: 0.6,
        people: 3,
        stuck: 1,
      },
      {
        provider: 'google',
        attempts: 10,
        ok: 9,
        refused: 1,
        refusedShare: 0.1,
        people: 1,
        stuck: 0,
      },
      {
        provider: 'apple',
        attempts: 0,
        ok: 0,
        refused: 0,
        refusedShare: null,
        people: 0,
        stuck: 0,
      },
    ])
  })
})

describe('shapeActivation', () => {
  const row = (platform: string, ...n: number[]) => ({
    platform,
    ...(Object.fromEntries(ACTIVATION_STEPS.map((s, i) => [s.id, n[i] ?? 0])) as Record<
      StepId,
      number
    >),
  })
  const a = shapeActivation([
    row('android', 10, 8, 4, 2, 2, 1, 0, 1),
    row('web', 20, 20, 5, 1, 1, 0, 0, 0),
  ])

  it('keeps the step order of the brief', () => {
    expect(a.steps.map((s) => s.id)).toEqual([
      'devices',
      'onboarded',
      'reg_started',
      'created',
      'verified',
      'graded',
      'settled',
      'linked',
    ])
  })
  it('computes step-to-step and overall conversion', () => {
    const and = a.rows.find((r) => r.platform === 'android')!
    expect(and.steps[1]).toEqual({ id: 'onboarded', n: 8, stepRate: 0.8, overall: 0.8 })
    expect(and.steps[3]).toEqual({ id: 'created', n: 2, stepRate: 0.5, overall: 0.2 })
    expect(and.steps[6].stepRate).toBe(0)
    expect(and.steps[7].stepRate).toBeNull() // nothing to convert from
  })
  it('has no onboarding on the web and compares registration with the first visit', () => {
    const web = a.rows.find((r) => r.platform === 'web')!
    expect(web.steps[1]).toEqual({ id: 'onboarded', n: null, stepRate: null, overall: null })
    expect(web.steps[2]).toEqual({ id: 'reg_started', n: 5, stepRate: 0.25, overall: 0.25 })
  })
  it('lists platforms in a fixed order and adds a total', () => {
    expect(a.rows.map((r) => r.platform)).toEqual(['web', 'android', 'all'])
    expect(a.rows[2].steps[0].n).toBe(30)
  })
  it('has no total row for a single platform', () => {
    expect(shapeActivation([row('ios', 3, 2)]).rows.map((r) => r.platform)).toEqual(['ios'])
  })
})

describe('landing pages and Search Console pages', () => {
  it('normalises entry paths', () => {
    expect(entryPath('/de/ratgeber/')).toBe('/de/ratgeber')
    expect(entryPath('/')).toBe('/')
  })
  it('tracks the Ratgeber and the calculator in every language they exist in', () => {
    expect(isTrackedPath('/ratgeber')).toBe(true)
    expect(isTrackedPath('/ratgeber/zeugnisgeld')).toBe(true)
    expect(isTrackedPath('/tools/grade-reward-calculator')).toBe(true)
    expect(isTrackedPath('/tools/zeugnisgeld-rechner')).toBe(true)
    expect(isTrackedPath('/tools/notendurchschnitt-rechner')).toBe(true)
    expect(isTrackedPath('/tools/allowance-calculator')).toBe(false)
    expect(isTrackedPath('/faq')).toBe(false)
    const urls = trackedPageUrls()
    expect(urls).toContain('https://bonifatus.com/de/ratgeber')
    expect(urls).toContain('https://bonifatus.com/de/tools/grade-reward-calculator')
    expect(urls.every((u) => u.startsWith('https://bonifatus.com/'))).toBe(true)
    expect(new Set(urls).size).toBe(urls.length)
  })
  it('sums the landing funnel over the Ratgeber and its calculators only', () => {
    const r = (page: string, visits: number, started: number, created: number) => ({
      page,
      visits,
      started,
      created,
    })
    expect(
      trackedLandingTotal([
        r('/de/ratgeber', 4, 1, 0),
        r('/de/ratgeber/zeugnisgeld', 10, 2, 1),
        r('/de/tools/zeugnisgeld-rechner', 5, 1, 1),
        r('/ru/tools/grade-reward-calculator', 3, 0, 0),
        r('/de', 50, 9, 3),
        r('/de/tools/allowance-calculator', 7, 1, 0),
        r('/', 2, 0, 0),
      ])
    ).toEqual({ visits: 22, started: 4, created: 2 })
  })
})

describe('Ratgeber article → calculator → sign-up', () => {
  const r = (page: string, visits: number, calculator: number, result: number, started = 0) => ({
    page,
    visits,
    calculator,
    result,
    started,
    created: 0,
  })
  it('puts a total row first, then articles by visits', () => {
    const rows = shapeArticlePath([
      r('/de/ratgeber/zeugnisgeld', 2, 1, 1, 1),
      r('/de/ratgeber/halbjahreszeugnis-bedeutung', 5, 2, 1),
    ])
    expect(rows.map((x) => x.page)).toEqual([
      'all articles',
      '/de/ratgeber/halbjahreszeugnis-bedeutung',
      '/de/ratgeber/zeugnisgeld',
    ])
    expect(rows[0]).toEqual({
      page: 'all articles',
      visits: 7,
      calculator: 3,
      result: 2,
      started: 1,
      created: 0,
    })
  })
  it('has only the total row when nobody entered on an article', () => {
    expect(shapeArticlePath([])).toEqual([r('all articles', 0, 0, 0)])
  })
})
