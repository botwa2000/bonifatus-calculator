import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/client', () => ({ pool: { query: vi.fn() } }))

import { analyse, personCode, sessionize, type BRow, type PersonMeta } from '@/lib/stats/behaviour'

const T0 = Date.UTC(2026, 10, 3, 10, 0, 0)
const sec = (s: number) => T0 + s * 1000
const DAY = 86_400_000

const screen = (uid: string, s: number, name: string, platform = 'ios'): BRow => ({
  ts: sec(s),
  uid,
  platform,
  kind: 'screen',
  name,
  screen: name,
  outcome: null,
})
const action = (
  uid: string,
  s: number,
  name: string,
  outcome: string,
  from: string | null = null
): BRow => ({
  ts: sec(s),
  uid,
  platform: 'ios',
  kind: 'action',
  name,
  screen: from,
  outcome,
})
const sorted = (rows: BRow[]) => [...rows].sort((a, b) => a.uid.localeCompare(b.uid) || a.ts - b.ts)
const opts = { from: T0 - DAY, to: T0 + 10 * DAY, now: T0 + DAY }

describe('behaviour sessions', () => {
  it('splits after 30 minutes idle, skips the splash screen and repeated views', () => {
    const s = sessionize([
      screen('a', 0, '/splash'),
      screen('a', 1, '/auth/login'),
      screen('a', 2, '/auth/login'),
      screen('a', 20, '/student/home'),
      screen('a', 20 + 31 * 60, '/student/home'),
    ])
    expect(s).toHaveLength(2)
    expect(s[0].views.map((v) => v.screen)).toEqual(['/auth/login', '/student/home'])
    expect(s[0].views[0].dwell).toBe(19_000)
    expect(s[0].views[1].dwell).toBeNull() // last view, nothing after it
    expect(s[1].views).toHaveLength(1)
  })

  it('credits an action to the screen it was started from', () => {
    const [s] = sessionize([
      screen('a', 0, '/student/calculator'),
      screen('a', 5, '/student/results'),
      action('a', 6, 'calculator_preview', 'ok', '/student/calculator'),
    ])
    expect(s.value).toBe(1)
    expect(s.views[0].value).toBe(1)
    expect(s.views[1].value).toBe(0)
  })
})

describe('behaviour analysis', () => {
  // g1: never gets past sign-in (3 rejected attempts, back and forth to forgot password).
  // c1: child, signs in, scans a report card, comes back the next day.
  // p1: parent, opens home and leaves.
  const rows = sorted([
    screen('g1', 0, '/auth/login'),
    action('g1', 5, 'signin', 'denied', '/auth/login'),
    screen('g1', 10, '/auth/forgot-password'),
    screen('g1', 20, '/auth/login'),
    action('g1', 25, 'signin', 'denied', '/auth/login'),
    action('g1', 30, 'signin', 'denied', '/auth/login'),
    screen('c1', 0, '/auth/login'),
    action('c1', 3, 'signin', 'ok', '/auth/login'),
    screen('c1', 4, '/student/home'),
    screen('c1', 10, '/student/notes/capture'),
    action('c1', 40, 'report_scan', 'ok', '/student/notes/capture'),
    screen('c1', 86_400 + 5, '/student/home'),
    screen('p1', 0, '/parent/home'),
  ])
  const meta = new Map<string, PersonMeta>([
    ['c1', { role: 'child', firstSeen: T0 }],
    ['p1', { role: 'parent', firstSeen: T0 - 30 * DAY }],
  ])
  const a = analyse(rows, meta, opts)

  it('builds the nested activation funnel', () => {
    expect(a.funnel.map((f) => f.people)).toEqual([3, 2, 1, 1, 1])
  })

  it('flags people stuck at sign-in and names them by pseudonymous code', () => {
    const g = a.people.find((p) => p.segment === 'guest')!
    expect(g.code).toBe(personCode('g1', null))
    expect(g.code).toMatch(/^G-[0-9A-F]{8}$/)
    expect(g.flags).toContain('stuck_signin')
    expect(a.people.find((p) => p.segment === 'child')!.code).toMatch(/^C-/)
    // p1 has an account row; a device without one is typed by the screens it reached
    const b = analyse([screen('d1', 0, '/parent/home')], new Map(), opts)
    expect(b.people[0]).toMatchObject({ segment: 'parent', stageIndex: 1 })
    expect(b.people[0].code).toMatch(/^P-/)
    const f = a.failures.find((x) => x.name === 'signin')!
    expect(f).toMatchObject({ n: 3, people: 1, gaveUp: 1 })
  })

  it('measures screens: dead ends, value rate and next steps', () => {
    const login = a.screens.find((s) => s.screen === '/auth/login')!
    expect(login.views).toBe(3)
    expect(login.deadEnds).toBe(1) // g1's session ends there with nothing done
    const scan = a.screens.find((s) => s.screen === '/student/notes/capture')!
    expect(scan.valueRate).toBe(1)
    expect(a.loops[0]).toMatchObject({ sessions: 1, people: 1 })
  })

  it('ranks weaknesses before strengths, biggest impact first', () => {
    const kinds = a.insights.map((i) => i.kind)
    expect(kinds.indexOf('strength')).toBeGreaterThan(kinds.lastIndexOf('weakness'))
    expect(
      a.insights.some((i) => i.kind === 'weakness' && /Sign-in failed \(rejected\)/.test(i.title))
    ).toBe(true)
    expect(a.insights[0].kind).toBe('weakness')
  })

  it('counts new vs returning people per segment', () => {
    const child = a.segments.find((s) => s.segment === 'child')!
    expect(child).toMatchObject({ people: 1, newPeople: 1, returnedShare: 1 })
    expect(a.segments.find((s) => s.segment === 'parent')!.newPeople).toBe(0)
  })
})

describe('person codes', () => {
  it('are stable, one-way and carry the role letter', () => {
    expect(personCode('x', 'parent')).toBe(personCode('x', 'parent'))
    expect(personCode('x', 'parent').slice(2)).toBe(personCode('x', null).slice(2))
    expect(personCode('x', 'parent')).not.toContain('x')
  })
})

describe('dashboard page', () => {
  it('ships a client script that parses', async () => {
    const { renderDashboardPage } = await import('@/lib/stats/render')
    const js = renderDashboardPage().split('<script>')[1].split('</script>')[0]
    expect(() => new Function(js)).not.toThrow()
    expect(js).toContain('function behaviourHtml(')
  })
})
