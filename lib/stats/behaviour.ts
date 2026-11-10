/**
 * App behaviour analytics for /admin/stats: sessions, screen performance, flows,
 * the activation funnel, segments, people and per-person timelines, plus an
 * automatic list of strengths and weaknesses.
 *
 * Scope: the iOS / Android apps (screen_view events + server-side core actions).
 * Web page views are a different shape (marketing pages, rotating anonymous
 * visitors) and stay in the "What people do" section.
 *
 * Privacy: people are shown as a pseudonymous code (P- parent, C- child, G- not
 * signed in) derived from the internal person id with a one-way hash. No name,
 * email or free text is ever read here. A device that later signs in merges
 * into its account, so its "G-" code becomes the account's code.
 *
 * The SQL only selects rows; everything else is pure TypeScript (analyse,
 * findInsights) so the definitions are unit-tested.
 */
import crypto from 'node:crypto'
import { q, uid, type Tables } from '@/lib/stats/sql'

// ── Definitions ──────────────────────────────────────────────────────────────
/** A new session starts after 30 minutes without any event (GA4 convention). */
export const SESSION_GAP_MS = 30 * 60_000
/** Time on a screen is capped: the app may have sat in the background. */
export const DWELL_CAP_MS = 30 * 60_000
const ROW_LIMIT = 250_000
const PEOPLE_LIMIT = 300

/** Successful actions that mean someone got something done. */
export const VALUE_ACTIONS = new Set([
  'grade_quick_save',
  'grade_term_save',
  'grade_term_update',
  'report_scan',
  'calculator_preview',
  'settlement_create',
  'invite_create',
  'invite_redeem',
])
const VALUE_EVENTS = new Set(['invite_share'])
/** Technical screens: shown for a split second, never a choice of the user. */
const SKIP_SCREENS = new Set(['/splash'])

export const SCREEN_LABELS: Record<string, string> = {
  '/onboarding': 'Onboarding',
  '/auth/login': 'Sign in',
  '/auth/register': 'Register',
  '/auth/forgot-password': 'Forgot password',
  '/auth/verify-email': 'Verify email',
  '/auth/google-profile': 'Google profile setup',
  '/auth/apple-profile': 'Apple profile setup',
  '/student/home': 'Child · Home',
  '/student/notes': 'Child · Grades',
  '/student/notes/detail/:id': 'Child · Grade detail',
  '/student/notes/cycle/:id': 'Child · Term',
  '/student/notes/capture': 'Child · Scan report card',
  '/student/calculator': 'Child · Calculator',
  '/student/results': 'Child · Results',
  '/student/results/:id': 'Child · Result',
  '/student/insights': 'Child · Insights',
  '/student/settings': 'Child · Settings',
  '/parent/home': 'Parent · Home',
  '/parent/children': 'Parent · Children',
  '/parent/children/:id': 'Parent · Child detail',
  '/parent/settle': 'Parent · Settle',
  '/parent/insights': 'Parent · Insights',
  '/parent/settings': 'Parent · Settings',
}
export const screenLabel = (s: string) => SCREEN_LABELS[s] ?? s

export const ACTION_LABELS: Record<string, string> = {
  grade_quick_save: 'Grade added',
  grade_term_save: 'Report card saved',
  grade_term_update: 'Report card edited',
  report_scan: 'Report card scanned',
  calculator_preview: 'Bonus calculated',
  settlement_create: 'Settlement paid',
  invite_create: 'Invite code created',
  invite_redeem: 'Invite redeemed',
  signup: 'Sign-up',
  signin: 'Sign-in',
  invite_share: 'Invite shared',
  invite_open: 'Invite link opened',
  scan_open: 'Scanner opened',
  scan_result: 'Scan finished',
  calculator_result: 'Bonus shown',
  review_prompt: 'Store review prompt shown',
  review_store_open: 'Store page opened',
  feedback_open: 'Feedback form opened',
  signup_start: 'Registration started',
  error: 'App error',
}
const actionLabel = (a: string) => ACTION_LABELS[a] ?? a.replace(/_/g, ' ')
const OUTCOME_LABELS: Record<string, string> = {
  denied: 'rejected',
  invalid: 'invalid input',
  not_found: 'not found',
  rate_limited: 'rate-limited',
  fail: 'server error',
  error: 'crashed',
}
const outcomeLabel = (o: string) => OUTCOME_LABELS[o] ?? o

/** Product areas for feature adoption: a screen prefix or a value action. */
const AREAS: {
  id: string
  label: string
  role: 'child' | 'parent'
  screens: string[]
  actions?: string[]
}[] = [
  {
    id: 'grades',
    label: 'Grades',
    role: 'child',
    screens: ['/student/notes'],
    actions: ['grade_quick_save'],
  },
  {
    id: 'scan',
    label: 'Report-card scan',
    role: 'child',
    screens: ['/student/notes/capture'],
    actions: ['report_scan'],
  },
  {
    id: 'calculator',
    label: 'Calculator',
    role: 'child',
    screens: ['/student/calculator'],
    actions: ['calculator_preview'],
  },
  { id: 'results', label: 'Saved results', role: 'child', screens: ['/student/results'] },
  { id: 'cinsights', label: 'Insights', role: 'child', screens: ['/student/insights'] },
  {
    id: 'children',
    label: 'Children',
    role: 'parent',
    screens: ['/parent/children'],
    actions: ['invite_create'],
  },
  {
    id: 'settle',
    label: 'Settle',
    role: 'parent',
    screens: ['/parent/settle'],
    actions: ['settlement_create'],
  },
  { id: 'pinsights', label: 'Insights', role: 'parent', screens: ['/parent/insights'] },
]

const isFeatureScreen = (s: string) =>
  /^\/(student|parent)\//.test(s) && !/\/(home|settings)$/.test(s)
const isSignedInScreen = (s: string) => /^\/(student|parent)\//.test(s)

export const FUNNEL = [
  { id: 'opened', label: 'Opened the app', miss: '' },
  { id: 'signed_in', label: 'Signed in', miss: 'never signed in' },
  { id: 'feature', label: 'Opened a feature', miss: 'never opened a feature' },
  { id: 'value', label: 'Got something done', miss: 'never completed an action' },
  { id: 'returned', label: 'Came back another day', miss: 'did not come back on another day' },
] as const

// ── Types ────────────────────────────────────────────────────────────────────
export type Kind = 'screen' | 'open' | 'event' | 'action'
export interface BRow {
  ts: number
  uid: string
  platform: string
  kind: Kind
  /** screen template for 'screen', else the event / action name */
  name: string
  /** screen an action was started from (X-Source), if sent */
  screen: string | null
  outcome: string | null
}
export interface PersonMeta {
  role: 'parent' | 'child' | null
  firstSeen: number | null
}
type Segment = 'parent' | 'child' | 'guest'

interface View {
  screen: string
  ts: number
  dwell: number | null
  value: number
  fails: number
}
export interface Session {
  uid: string
  platform: string
  start: number
  end: number
  rows: BRow[]
  views: View[]
  value: number
  fails: number
}

/** Pseudonymous person code: role letter + 8 hex of a one-way hash. */
export function personCode(id: string, role: PersonMeta['role']): string {
  const h = crypto.createHash('sha256').update(`bonifatus-stats:${id}`).digest('hex')
  return `${role === 'parent' ? 'P' : role === 'child' ? 'C' : 'G'}-${h.slice(0, 8).toUpperCase()}`
}
const codeHash = (code: string) =>
  code
    .trim()
    .toUpperCase()
    .replace(/^[PCG]-/, '')

const isOk = (r: BRow) => r.outcome === 'ok'
const isValue = (r: BRow) =>
  (r.kind === 'action' && isOk(r) && VALUE_ACTIONS.has(r.name)) ||
  (r.kind === 'event' && VALUE_EVENTS.has(r.name))
const isFail = (r: BRow) =>
  (r.kind === 'action' && r.outcome !== 'ok') || (r.kind === 'event' && r.name === 'error')
const dayOf = (ts: number) => new Date(ts).toISOString().slice(0, 10)

// ── Sessions ─────────────────────────────────────────────────────────────────
/** Split one person's rows (sorted by time) into sessions with screen views. */
export function sessionize(rows: BRow[]): Session[] {
  const out: Session[] = []
  let cur: Session | null = null
  for (const r of rows) {
    if (!cur || r.uid !== cur.uid || r.ts - cur.end > SESSION_GAP_MS) {
      cur = {
        uid: r.uid,
        platform: r.platform,
        start: r.ts,
        end: r.ts,
        rows: [],
        views: [],
        value: 0,
        fails: 0,
      }
      out.push(cur)
    }
    cur.end = Math.max(cur.end, r.ts)
    cur.rows.push(r)
    if (r.kind === 'screen') {
      if (SKIP_SCREENS.has(r.name)) continue
      const prev = cur.views[cur.views.length - 1]
      if (prev?.screen === r.name) continue
      cur.views.push({ screen: r.name, ts: r.ts, dwell: null, value: 0, fails: 0 })
      continue
    }
    const value = isValue(r)
    const fail = isFail(r)
    if (!value && !fail) continue
    if (value) cur.value++
    if (fail) cur.fails++
    // Attribute to the screen the action came from (X-Source) when it is open
    // in this session, else to the screen on display at that moment.
    const views = cur.views
    let v: View | undefined
    if (r.screen)
      for (let i = views.length - 1; i >= 0 && !v; i--)
        if (views[i].screen === r.screen && views[i].ts <= r.ts + 60_000) v = views[i]
    if (!v) for (let i = views.length - 1; i >= 0 && !v; i--) if (views[i].ts <= r.ts) v = views[i]
    if (!v) continue
    if (value) v.value++
    if (fail) v.fails++
  }
  for (const s of out)
    s.views.forEach((v, i) => {
      const next = s.views[i + 1]
      const d = (next ? next.ts : s.end) - v.ts
      v.dwell = d > 0 ? Math.min(d, DWELL_CAP_MS) : null
    })
  return out
}

const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const share = (a: number, b: number) => (b ? a / b : null)

// ── Analysis ─────────────────────────────────────────────────────────────────
export interface AnalyseOptions {
  from: number
  to: number
  now?: number
}

function measure(rows: BRow[], meta: Map<string, PersonMeta>, o: AnalyseOptions) {
  const now = o.now ?? Date.now()
  const sessions = sessionize(rows)

  // People
  interface P {
    id: string
    segment: Segment
    role: PersonMeta['role']
    platforms: Set<string>
    first: number
    last: number
    firstSeen: number | null
    days: Set<string>
    sessions: number
    time: number
    views: number
    value: number
    fails: number
    lastScreen: string | null
    signedIn: boolean
    feature: boolean
    areas: Set<string>
    failedBy: Map<string, number>
    okBy: Map<string, number>
  }
  const people = new Map<string, P>()
  const inferred = new Map<string, 'parent' | 'child'>()
  for (const r of rows)
    if (r.kind === 'screen' && isSignedInScreen(r.name) && !inferred.has(r.uid))
      inferred.set(r.uid, r.name.startsWith('/parent/') ? 'parent' : 'child')
  const person = (id: string): P => {
    let p = people.get(id)
    if (!p) {
      const m = meta.get(id)
      // No account row (deleted, or a device whose sign-in was never linked):
      // the screens it reached still tell child from parent.
      const role = m?.role ?? inferred.get(id) ?? null
      p = {
        id,
        role,
        segment: role ?? 'guest',
        platforms: new Set(),
        first: Infinity,
        last: 0,
        firstSeen: m?.firstSeen ?? null,
        days: new Set(),
        sessions: 0,
        time: 0,
        views: 0,
        value: 0,
        fails: 0,
        lastScreen: null,
        signedIn: !!role,
        feature: false,
        areas: new Set(),
        failedBy: new Map(),
        okBy: new Map(),
      }
      people.set(id, p)
    }
    return p
  }

  // Screens
  interface S {
    views: number
    people: Set<string>
    sessions: number
    entries: number
    exits: number
    deadEnds: number
    valueViews: number
    fails: number
    dwell: number[]
    next: Map<string, number>
  }
  const screens = new Map<string, S>()
  const scr = (s: string): S => {
    let x = screens.get(s)
    if (!x)
      screens.set(
        s,
        (x = {
          views: 0,
          people: new Set(),
          sessions: 0,
          entries: 0,
          exits: 0,
          deadEnds: 0,
          valueViews: 0,
          fails: 0,
          dwell: [],
          next: new Map(),
        })
      )
    return x
  }
  const transitions = new Map<string, number>()
  const loops = new Map<string, { a: string; b: string; sessions: number; people: Set<string> }>()
  const failures = new Map<
    string,
    { name: string; outcome: string; n: number; people: Set<string>; screens: Map<string, number> }
  >()
  const sessionLengths: number[] = []
  let productive = 0
  let bounces = 0

  for (const s of sessions) {
    const p = person(s.uid)
    p.platforms.add(s.platform)
    p.first = Math.min(p.first, s.start)
    p.last = Math.max(p.last, s.end)
    p.sessions++
    p.time += s.end - s.start
    p.value += s.value
    p.fails += s.fails
    for (const r of s.rows) {
      p.days.add(dayOf(r.ts))
      if (r.kind === 'action') {
        const m = isOk(r) ? p.okBy : p.failedBy
        m.set(r.name, Math.max(m.get(r.name) ?? 0, r.ts))
        if (r.name === 'signin' && isOk(r)) p.signedIn = true
        for (const a of AREAS) if (isOk(r) && a.actions?.includes(r.name)) p.areas.add(a.id)
      }
      if (isFail(r)) {
        const outcome = r.kind === 'event' ? 'error' : String(r.outcome ?? 'fail')
        const key = `${r.name}|${outcome}`
        let f = failures.get(key)
        if (!f)
          failures.set(
            key,
            (f = { name: r.name, outcome, n: 0, people: new Set(), screens: new Map() })
          )
        f.n++
        f.people.add(s.uid)
        const at = r.screen ?? '(unknown)'
        f.screens.set(at, (f.screens.get(at) ?? 0) + 1)
      }
    }
    sessionLengths.push(s.end - s.start)
    if (s.value) productive++
    if (s.views.length <= 1 && !s.value && s.end - s.start < 10_000) bounces++

    const seen = new Set<string>()
    s.views.forEach((v, i) => {
      const x = scr(v.screen)
      x.views++
      x.people.add(s.uid)
      if (!seen.has(v.screen)) {
        x.sessions++
        seen.add(v.screen)
      }
      if (i === 0) x.entries++
      if (v.dwell != null) x.dwell.push(v.dwell)
      if (v.value) x.valueViews++
      x.fails += v.fails
      const next = s.views[i + 1]?.screen ?? '(exit)'
      x.next.set(next, (x.next.get(next) ?? 0) + 1)
      if (!s.views[i + 1]) {
        x.exits++
        if (!s.value) x.deadEnds++
      } else {
        const k = `${v.screen}→${next}`
        transitions.set(k, (transitions.get(k) ?? 0) + 1)
      }
      p.views++
      p.lastScreen = v.screen
      if (isSignedInScreen(v.screen)) p.signedIn = true
      if (isFeatureScreen(v.screen)) p.feature = true
      for (const a of AREAS)
        if (a.screens.some((pre) => v.screen.startsWith(pre))) p.areas.add(a.id)
    })
    // Back-and-forth: A → B → A in one session.
    const counted = new Set<string>()
    for (let i = 0; i + 2 < s.views.length; i++) {
      const a = s.views[i].screen
      const b = s.views[i + 1].screen
      if (a !== s.views[i + 2].screen || a === b) continue
      const [x, y] = [a, b].sort()
      const k = `${x}↔${y}`
      if (counted.has(k)) continue
      counted.add(k)
      let l = loops.get(k)
      if (!l) loops.set(k, (l = { a: x, b: y, sessions: 0, people: new Set() }))
      l.sessions++
      l.people.add(s.uid)
    }
  }

  const all = [...people.values()]
  const stage = (p: P) => {
    if (!p.signedIn) return 0
    if (!p.feature) return 1
    if (!p.value) return 2
    if (p.days.size < 2) return 3
    return 4
  }
  const funnel = FUNNEL.map((f, i) => {
    const n = all.filter((p) => stage(p) >= i).length
    return { id: f.id, label: f.label, miss: f.miss, people: n }
  })

  const segments = (['parent', 'child', 'guest'] as Segment[]).map((seg) => {
    const ps = all.filter((p) => p.segment === seg)
    const ss = sessions.filter((s) => people.get(s.uid)?.segment === seg)
    return {
      segment: seg,
      people: ps.length,
      newPeople: ps.filter((p) => p.firstSeen != null && p.firstSeen >= o.from).length,
      sessions: ss.length,
      sessionsPerPerson: share(ss.length, ps.length),
      medianSessionMs: median(ss.map((s) => s.end - s.start)),
      activeDaysPerPerson: share(
        ps.reduce((a, p) => a + p.days.size, 0),
        ps.length
      ),
      valuePerPerson: share(
        ps.reduce((a, p) => a + p.value, 0),
        ps.length
      ),
      productiveShare: share(ss.filter((s) => s.value).length, ss.length),
      returnedShare: share(ps.filter((p) => p.days.size >= 2).length, ps.length),
    }
  })

  const signedInBy = (role: 'child' | 'parent') => all.filter((p) => p.role === role)
  const adoption = AREAS.map((a) => {
    const base = signedInBy(a.role)
    const used = base.filter((p) => p.areas.has(a.id)).length
    return {
      id: a.id,
      label: a.label,
      role: a.role,
      people: used,
      base: base.length,
      share: share(used, base.length),
    }
  })

  const screenList = [...screens.entries()]
    .map(([screen, x]) => ({
      screen,
      label: screenLabel(screen),
      views: x.views,
      people: x.people.size,
      sessions: x.sessions,
      entries: x.entries,
      exits: x.exits,
      exitRate: share(x.exits, x.views),
      deadEnds: x.deadEnds,
      deadEndRate: share(x.deadEnds, x.sessions),
      valueViews: x.valueViews,
      valueRate: share(x.valueViews, x.views),
      fails: x.fails,
      medianDwellMs: median(x.dwell),
      next: [...x.next.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([to, n]) => ({
          to,
          label: to === '(exit)' ? 'Left the app' : screenLabel(to),
          n,
          share: n / x.views,
        })),
    }))
    .sort((a, b) => b.views - a.views)

  const dayBuckets = [
    { label: '1 day', min: 1, max: 1 },
    { label: '2 days', min: 2, max: 2 },
    { label: '3–6 days', min: 3, max: 6 },
    { label: '7+ days', min: 7, max: Infinity },
  ].map((b) => ({
    label: b.label,
    people: all.filter((p) => p.days.size >= b.min && p.days.size <= b.max).length,
  }))
  const lenBuckets = [
    { label: '< 10 s', max: 10_000 },
    { label: '10–60 s', max: 60_000 },
    { label: '1–3 min', max: 180_000 },
    { label: '3–10 min', max: 600_000 },
    { label: '10+ min', max: Infinity },
  ].map((b, i, arr) => ({
    label: b.label,
    sessions: sessionLengths.filter((l) => l < b.max && (i === 0 || l >= arr[i - 1].max)).length,
  }))

  const peopleList = all
    .sort((a, b) => b.last - a.last)
    .slice(0, PEOPLE_LIMIT)
    .map((p) => {
      const gaveUp = [...p.failedBy.entries()]
        .filter(([a, t]) => (p.okBy.get(a) ?? 0) < t)
        .map(([a]) => a)
      const flags: string[] = []
      if (!p.signedIn && p.failedBy.has('signin')) flags.push('stuck_signin')
      else if (gaveUp.length) flags.push('gave_up')
      if (p.days.size >= 4 || p.value >= 5) flags.push('power')
      if (p.firstSeen != null && p.firstSeen >= o.from) flags.push('new')
      if (now - p.last > 7 * 86_400_000) flags.push('dormant')
      return {
        code: personCode(p.id, p.role),
        segment: p.segment,
        platforms: [...p.platforms],
        firstSeen: p.firstSeen ? new Date(p.firstSeen).toISOString() : null,
        lastSeen: new Date(p.last).toISOString(),
        activeDays: p.days.size,
        sessions: p.sessions,
        timeMs: p.time,
        views: p.views,
        value: p.value,
        fails: p.fails,
        lastScreen: p.lastScreen ? screenLabel(p.lastScreen) : null,
        stage: FUNNEL[stage(p)].label,
        stageIndex: stage(p),
        flags,
        gaveUp: gaveUp.map(actionLabel),
      }
    })

  const failureList = [...failures.values()]
    .map((f) => {
      const gaveUp = [...f.people].filter((id) => {
        const p = people.get(id)!
        return (p.okBy.get(f.name) ?? 0) < (p.failedBy.get(f.name) ?? 0)
      }).length
      return {
        name: f.name,
        label: actionLabel(f.name),
        outcome: f.outcome,
        outcomeLabel: outcomeLabel(f.outcome),
        n: f.n,
        people: f.people.size,
        gaveUp,
        screens: [...f.screens.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([s, n]) => ({ screen: s, label: screenLabel(s), n })),
      }
    })
    .sort((a, b) => b.people - a.people || b.n - a.n)

  const summary = {
    people: all.length,
    newPeople: all.filter((p) => p.firstSeen != null && p.firstSeen >= o.from).length,
    sessions: sessions.length,
    sessionsPerPerson: share(sessions.length, all.length),
    medianSessionMs: median(sessionLengths),
    medianScreensPerSession: median(sessions.map((s) => s.views.length)),
    productiveShare: share(productive, sessions.length),
    bounceShare: share(bounces, sessions.length),
    returnedShare: share(all.filter((p) => p.days.size >= 2).length, all.length),
    failingPeople: all.filter((p) => p.fails > 0).length,
  }

  const result = {
    summary,
    funnel,
    segments,
    adoption,
    screens: screenList,
    transitions: [...transitions.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([k, n]) => {
        const [from, to] = k.split('→')
        return { from: screenLabel(from), to: screenLabel(to), n }
      }),
    loops: [...loops.values()]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8)
      .map((l) => ({
        a: screenLabel(l.a),
        b: screenLabel(l.b),
        sessions: l.sessions,
        people: l.people.size,
      })),
    failures: failureList,
    activeDays: dayBuckets,
    sessionLengths: lenBuckets,
    people: peopleList,
    peopleTotal: all.length,
  }
  return result
}

export type Analysis = ReturnType<typeof measure>

/** Everything the Behaviour section shows, from the rows of one period. */
export function analyse(rows: BRow[], meta: Map<string, PersonMeta>, o: AnalyseOptions) {
  const m = measure(rows, meta, o)
  return { ...m, insights: findInsights(m) }
}

// ── Strengths & weaknesses ───────────────────────────────────────────────────
export interface Insight {
  kind: 'weakness' | 'strength'
  title: string
  detail: string
  /** people (or sessions) affected: ranks the list */
  impact: number
  /** sample the claim rests on; under 20 the dashboard marks it as early */
  base: number
}

const pc = (x: number) => `${Math.round(x * 100)}%`
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** Rules over the analysis that point at what to fix and what works. */
export function findInsights(a: Analysis): Insight[] {
  const out: Insight[] = []
  const f = a.funnel

  // Funnel: the biggest leak, and every step that holds well.
  let worst: { i: number; lost: number } | null = null
  for (let i = 1; i < f.length; i++) {
    const lost = f[i - 1].people - f[i].people
    if (lost > 0 && (!worst || lost > worst.lost)) worst = { i, lost }
  }
  if (worst) {
    const prev = f[worst.i - 1]
    out.push({
      kind: 'weakness',
      title: `Biggest drop: “${prev.label}” → “${f[worst.i].label}”`,
      detail: `${worst.lost} of ${prev.people} people (${pc(worst.lost / prev.people)}) ${f[worst.i].miss}.`,
      impact: worst.lost,
      base: prev.people,
    })
  }
  for (let i = 1; i < f.length; i++) {
    const prev = f[i - 1]
    if (prev.people >= 3 && f[i].people / prev.people >= 0.8 && i !== worst?.i)
      out.push({
        kind: 'strength',
        title: `“${prev.label}” → “${f[i].label}” holds`,
        detail: `${pc(f[i].people / prev.people)} make this step (${f[i].people} of ${prev.people}).`,
        impact: f[i].people,
        base: prev.people,
      })
  }

  // Failures people did not recover from.
  for (const x of a.failures.slice(0, 4)) {
    const where =
      x.screens[0] && x.screens[0].screen !== '(unknown)'
        ? ` on the ${x.screens[0].label} screen`
        : ''
    out.push({
      kind: 'weakness',
      title: `${x.label} failed (${outcomeLabel(x.outcome)})${where}`,
      detail:
        `${plural(x.n, 'time')} for ${plural(x.people, 'person', 'people')}` +
        (x.gaveUp ? `; ${x.gaveUp} never succeeded afterwards.` : '; all of them succeeded later.'),
      impact: x.gaveUp * 2 + x.people,
      base: x.people,
    })
  }

  // Dead ends: sessions that stop on a screen without anything done.
  for (const s of a.screens
    .filter((s) => s.sessions >= 2 && (s.deadEndRate ?? 0) >= 0.3)
    .slice(0, 3))
    out.push({
      kind: 'weakness',
      title: `Sessions end on ${s.label} with nothing done`,
      detail: `${pc(s.deadEndRate!)} of sessions that reach this screen (${s.deadEnds} of ${s.sessions}) close the app here without a single completed action.`,
      impact: s.deadEnds,
      base: s.sessions,
    })

  // Back-and-forth between two screens: people looking for something.
  for (const l of a.loops.filter((l) => l.sessions >= 2).slice(0, 2))
    out.push({
      kind: 'weakness',
      title: `Back and forth: ${l.a} ↔ ${l.b}`,
      detail: `${plural(l.sessions, 'session')} (${plural(l.people, 'person', 'people')}) bounce between these screens — a sign they don't find what they need.`,
      impact: l.people,
      base: l.sessions,
    })

  // One-and-done vs coming back.
  const sm = a.summary
  if (sm.people >= 3 && sm.returnedShare != null) {
    if (sm.returnedShare >= 0.3)
      out.push({
        kind: 'strength',
        title: 'People come back',
        detail: `${pc(sm.returnedShare)} of people were active on two or more days in this period.`,
        impact: Math.round(sm.returnedShare * sm.people),
        base: sm.people,
      })
    else
      out.push({
        kind: 'weakness',
        title: 'Most people use the app on a single day',
        detail: `Only ${pc(sm.returnedShare)} came back on another day in this period.`,
        impact: Math.round((1 - sm.returnedShare) * sm.people),
        base: sm.people,
      })
  }

  // Screens that turn visits into done work.
  for (const s of a.screens
    .filter((s) => s.views >= 3 && (s.valueRate ?? 0) >= 0.25)
    .sort((x, y) => (y.valueRate ?? 0) - (x.valueRate ?? 0))
    .slice(0, 2))
    out.push({
      kind: 'strength',
      title: `${s.label} converts`,
      detail: `${pc(s.valueRate!)} of visits end with a completed action (${s.valueViews} of ${s.views}).`,
      impact: s.valueViews,
      base: s.views,
    })

  // Most and least adopted features of signed-in people.
  const ad = a.adoption.filter((x) => x.base >= 3)
  const top = [...ad].sort((x, y) => (y.share ?? 0) - (x.share ?? 0))[0]
  if (top && (top.share ?? 0) >= 0.5)
    out.push({
      kind: 'strength',
      title: `${top.role === 'child' ? 'Children' : 'Parents'} use ${top.label}`,
      detail: `${pc(top.share!)} of signed-in ${top.role === 'child' ? 'children' : 'parents'} opened it (${top.people} of ${top.base}).`,
      impact: top.people,
      base: top.base,
    })
  for (const x of ad.filter((x) => (x.share ?? 0) < 0.15).slice(0, 2))
    out.push({
      kind: 'weakness',
      title: `${x.label} is barely discovered by ${x.role === 'child' ? 'children' : 'parents'}`,
      detail: `${x.people} of ${x.base} signed-in ${x.role === 'child' ? 'children' : 'parents'} (${pc(x.share ?? 0)}) used it.`,
      impact: x.base - x.people,
      base: x.base,
    })

  if (sm.sessions >= 5 && sm.productiveShare != null && sm.productiveShare >= 0.4)
    out.push({
      kind: 'strength',
      title: 'Sessions are productive',
      detail: `${pc(sm.productiveShare)} of sessions include at least one completed action.`,
      impact: Math.round(sm.productiveShare * sm.sessions),
      base: sm.sessions,
    })

  return out.sort((x, y) =>
    x.kind === y.kind ? y.impact - x.impact : x.kind === 'weakness' ? -1 : 1
  )
}

// ── Queries ──────────────────────────────────────────────────────────────────
const APP_PLATFORMS = `platform IN ('ios', 'android', 'app') AND ($3 = 'all' OR platform = $3)`

/** App rows of a period, person id resolved, ordered for sessionize(). */
export function rowsSql(t: Tables, extra = '') {
  return `SELECT ts, platform, uid, kind, name, screen, outcome FROM (
      SELECT e.ts, e.platform, ${uid('e')} AS uid,
             CASE e.event WHEN 'screen_view' THEN 'screen' WHEN 'app_open' THEN 'open' ELSE 'event' END AS kind,
             CASE WHEN e.event = 'screen_view' THEN COALESCE(e.screen, '') ELSE e.event END AS name,
             e.screen, CASE WHEN e.event = 'app_open' THEN e.props->>'mode' END AS outcome
        FROM ${t.usage_events} e
       WHERE e.ts >= $1 AND e.ts < $2 AND ${APP_PLATFORMS} AND e.event NOT IN ('page_view', 'engage')
      UNION ALL
      SELECT a.ts, a.platform, ${uid('a')}, 'action', a.action,
             CASE WHEN a.source IS NULL THEN NULL ELSE '/' || replace(a.source, '.', '/') END, a.outcome
        FROM ${t.action_log} a
       WHERE a.ts >= $1 AND a.ts < $2 AND ${APP_PLATFORMS} AND a.action NOT IN ('bot_check', 'market_fetch')
    ) x WHERE uid IS NOT NULL ${extra}
    ORDER BY uid, ts LIMIT ${ROW_LIMIT + 1}`
}

const toRow = (r: Record<string, unknown>): BRow => ({
  ts: new Date(r.ts as string).getTime(),
  uid: r.uid as string,
  platform: r.platform as string,
  kind: r.kind as Kind,
  name: r.name as string,
  screen: (r.screen as string) ?? null,
  outcome: (r.outcome as string) ?? null,
})

async function metaFor(ids: string[], t: Tables): Promise<Map<string, PersonMeta>> {
  const m = new Map<string, PersonMeta>()
  if (!ids.length) return m
  const rows = await q(
    `SELECT x.id, p.role,
            COALESCE((SELECT MIN(i.first_seen) FROM usage_installs i WHERE i.user_id = x.id),
                     (SELECT i.first_seen FROM usage_installs i WHERE i.install_id = x.id)) AS first_seen
       FROM unnest($1::text[]) AS x(id)
       LEFT JOIN ${t.user_profiles} p ON p.id::text = x.id`,
    [ids]
  )
  for (const r of rows)
    m.set(r.id as string, {
      role: r.role === 'parent' || r.role === 'child' ? r.role : null,
      firstSeen: r.first_seen ? new Date(r.first_seen as string).getTime() : null,
    })
  return m
}

/** The Behaviour section of GET /api/admin/usage-stats. */
export async function behaviour(w: { from: Date; to: Date }, p: string, t: Tables) {
  if (p === 'web') return null
  const raw = await q(rowsSql(t), [w.from, w.to, p])
  const truncated = raw.length > ROW_LIMIT
  const rows = raw.slice(0, ROW_LIMIT).map(toRow)
  const meta = await metaFor([...new Set(rows.map((r) => r.uid))], t)
  return { truncated, ...analyse(rows, meta, { from: w.from.getTime(), to: w.to.getTime() }) }
}

// ── One person ───────────────────────────────────────────────────────────────
const TIMELINE_DAYS = 90

/** Every app session of one person (by code) in the last 90 days, newest first. */
export async function personTimeline(code: string, t: Tables) {
  const hash = codeHash(code)
  if (!/^[0-9A-F]{8}$/.test(hash)) return null
  const to = new Date(Date.now() + 60_000)
  const from = new Date(to.getTime() - TIMELINE_DAYS * 86_400_000)
  const ids = await q<{ uid: string }>(
    `SELECT DISTINCT uid FROM (${rowsSql(t).replace(/ORDER BY uid, ts LIMIT \d+$/, '')}) y`,
    [from, to, 'all']
  )
  const id = ids.map((r) => r.uid).find((u) => personCode(u, null).slice(2) === hash)
  if (!id) return null
  const rows = (await q(rowsSql(t, 'AND uid = $4'), [from, to, 'all', id])).map(toRow)
  const meta = (await metaFor([id], t)).get(id) ?? { role: null, firstSeen: null }
  const sessions = sessionize(rows).reverse()
  const signedIn = rows.find((r) => r.kind === 'screen' && isSignedInScreen(r.name))
  const role =
    meta.role ?? (signedIn ? (signedIn.name.startsWith('/parent/') ? 'parent' : 'child') : null)
  return {
    code: personCode(id, role),
    segment: role ?? 'guest',
    firstSeen: meta.firstSeen ? new Date(meta.firstSeen).toISOString() : null,
    days: TIMELINE_DAYS,
    sessions: sessions.slice(0, 100).map((s) => ({
      start: new Date(s.start).toISOString(),
      durationMs: s.end - s.start,
      platform: s.platform,
      value: s.value,
      fails: s.fails,
      steps: s.rows
        .filter((r) => !(r.kind === 'screen' && SKIP_SCREENS.has(r.name)))
        .map((r) => {
          const view =
            r.kind === 'screen'
              ? s.views.find((v) => v.ts === r.ts && v.screen === r.name)
              : undefined
          return {
            at: new Date(r.ts).toISOString(),
            kind: r.kind,
            label:
              r.kind === 'screen'
                ? screenLabel(r.name)
                : r.kind === 'open'
                  ? r.outcome === 'resume'
                    ? 'Back in the app'
                    : 'App started'
                  : actionLabel(r.name),
            outcome: r.kind === 'action' ? r.outcome : null,
            outcomeLabel:
              r.kind === 'action' && r.outcome && r.outcome !== 'ok'
                ? outcomeLabel(r.outcome)
                : null,
            value: isValue(r),
            fail: isFail(r),
            dwellMs: view?.dwell ?? null,
          }
        }),
    })),
    sessionsTotal: sessions.length,
    totals: {
      sessions: sessions.length,
      activeDays: new Set(rows.map((r) => dayOf(r.ts))).size,
      value: sessions.reduce((a, s) => a + s.value, 0),
      fails: sessions.reduce((a, s) => a + s.fails, 0),
      views: sessions.reduce((a, s) => a + s.views.length, 0),
    },
  }
}
