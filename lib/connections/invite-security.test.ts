/**
 * Invite codes: entropy, input forgiveness, redeem limits with lockout and backoff,
 * failure logging, single use, revoke and the 7-day validity (fake clock).
 *
 * The database is faked: every awaited select / update…returning / execute takes the
 * next queued result; inserts are recorded in `h.inserted` and consume nothing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  const results: unknown[] = []
  const inserted: Array<{ values: Record<string, unknown> }> = []
  const updates: Array<Record<string, unknown>> = []
  const executed: string[] = []
  const next = () => (results.length ? results.shift() : [])
  const chain = (): unknown =>
    new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === 'then') {
            const value = next()
            return (resolve: (v: unknown) => void) => resolve(value)
          }
          if (prop === 'set') {
            return (v: Record<string, unknown>) => {
              updates.push(v)
              return chain()
            }
          }
          return () => chain()
        },
      }
    )
  const tx = {
    select: () => chain(),
    update: () => chain(),
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        inserted.push({ values })
        const done = Promise.resolve([])
        return Object.assign(done, { returning: () => chain() })
      },
    }),
    execute: async () => {
      executed.push('execute')
      return { rows: next() }
    },
  }
  const db = {
    ...tx,
    transaction: async (fn: (t: unknown) => Promise<unknown>) => fn(tx),
  }
  return { results, inserted, updates, executed, db, profile: { id: 'kid1', role: 'child' } }
})

vi.mock('@/lib/db/client', () => ({ db: h.db, pool: { query: vi.fn() } }))
vi.mock('@/lib/auth/session', () => ({
  requireAuthApi: async () => ({ id: h.profile.id }),
  getUserProfile: async () => h.profile,
}))
vi.mock('@/lib/stats/with-action-log', () => ({
  withActionLog: (_a: string, handler: unknown) => handler,
  noteAction: (res: Response) => res,
}))

import { NextRequest } from 'next/server'
import {
  formatInviteCode,
  generateInviteCode,
  INVITE_ALPHABET,
  INVITE_CODE_LENGTH,
  INVITE_VALIDITY_MS,
  normalizeInviteCode,
} from '@/lib/connections/invite-code'
import {
  activeLock,
  BASE_LOCK_MS,
  FREE_FAILURES,
  lockDurationMs,
  lockNames,
  MAX_LOCK_MS,
  scopesLockedBy,
  type FailureStats,
} from '@/lib/connections/redeem-limits'
import { POST as redeemPost } from '@/app/api/connections/redeem/route'
import { POST as invitePost } from '@/app/api/connections/invite/route'
import { POST as revokePost } from '@/app/api/connections/invite/revoke/route'

const T0 = new Date('2026-11-26T10:00:00Z').getTime()
const MIN = 60_000

const noFailures = (): FailureStats => ({
  account: { count: 0, last: null },
  device: { count: 0, last: null },
  ip: { count: 0, last: null },
})

/** Fake-DB rows for the limiter: advisory locks granted, then the failure counts. */
const lockRows = (n: number) => Array.from({ length: n }, () => [{ ok: true }])
const statsRow = (o: Partial<Record<string, number | null>> = {}) => [
  {
    account_n: 0,
    account_age: null,
    ip_n: 0,
    ip_age: null,
    device_n: 0,
    device_age: null,
    ...o,
  },
]

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost/api/connections/redeem', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': '198.51.100.9',
      'x-device-id': '0123456789abcdef',
      'x-platform': 'android',
      ...headers,
    },
    body: JSON.stringify(body),
  })

const failures = () =>
  h.inserted.filter((r) => r.values.eventType === 'invite_redeem_failure').map((r) => r.values)

beforeEach(() => {
  h.results.length = 0
  h.inserted.length = 0
  h.updates.length = 0
  h.executed.length = 0
  h.profile = { id: 'kid1', role: 'child' }
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(T0)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('invite code', () => {
  it('has at least 40 bits of entropy', () => {
    const bits = INVITE_CODE_LENGTH * Math.log2(new Set(INVITE_ALPHABET).size)
    expect(bits).toBeGreaterThanOrEqual(40)
    expect(bits).toBe(50)
  })

  it('only uses the unambiguous alphabet and does not repeat', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i += 1) {
      const c = generateInviteCode()
      expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{10}$/)
      seen.add(c)
    }
    expect(seen.size).toBe(2000)
  })

  it('forgives case, separators and look-alikes, and rejects everything else', () => {
    expect(normalizeInviteCode('abcde-fghjk')).toBe('ABCDEFGHJK')
    expect(normalizeInviteCode(' AB CDE FGH JK ')).toBe('ABCDEFGHJK')
    expect(normalizeInviteCode('O0IL1-ABCDE')).toBe('00111ABCDE')
    expect(normalizeInviteCode('123456')).toBeNull() // old 6-digit format
    expect(normalizeInviteCode('ABCDEFGHJU')).toBeNull() // U is not in the alphabet
    expect(normalizeInviteCode('ABCDEFGHJKM')).toBeNull()
    expect(normalizeInviteCode('A'.repeat(41))).toBeNull()
    expect(normalizeInviteCode(1234567890)).toBeNull()
    expect(normalizeInviteCode("ABCDE' OR 1=1")).toBeNull()
  })

  it('is shown in two groups of five', () => {
    expect(formatInviteCode('ABCDEFGHJK')).toBe('ABCDE-FGHJK')
  })
})

describe('lockout and backoff', () => {
  it('locks at the free limit and doubles per further failure, capped at 24 h', () => {
    const free = FREE_FAILURES.account
    expect(lockDurationMs(free - 1, free)).toBe(0)
    expect(lockDurationMs(free, free)).toBe(15 * MIN)
    expect(lockDurationMs(free + 1, free)).toBe(30 * MIN)
    expect(lockDurationMs(free + 2, free)).toBe(60 * MIN)
    expect(lockDurationMs(free + 20, free)).toBe(MAX_LOCK_MS)
  })

  it('applies per account, per device and per IP, each with its own limit', () => {
    const now = T0
    for (const scope of ['account', 'device', 'ip'] as const) {
      const stats = noFailures()
      stats[scope] = { count: FREE_FAILURES[scope] - 1, last: new Date(now - MIN) }
      expect(activeLock(stats, now)).toBeNull()
      stats[scope] = { count: FREE_FAILURES[scope], last: new Date(now - MIN) }
      expect(activeLock(stats, now)).toEqual({
        scope,
        until: new Date(now - MIN + BASE_LOCK_MS),
      })
    }
  })

  it('ends when the lock time has passed (fake clock)', () => {
    const stats = noFailures()
    stats.account = { count: FREE_FAILURES.account, last: new Date(T0) }
    expect(activeLock(stats, T0 + 14 * MIN)).not.toBeNull()
    expect(activeLock(stats, T0 + 16 * MIN)).toBeNull()
  })

  it('reports the scope whose lock lasts longest', () => {
    const stats = noFailures()
    stats.account = { count: FREE_FAILURES.account, last: new Date(T0) }
    stats.ip = { count: FREE_FAILURES.ip + 2, last: new Date(T0) }
    expect(activeLock(stats, T0)?.scope).toBe('ip')
  })

  it('marks the failure that starts a lock', () => {
    const stats = noFailures()
    stats.device.count = FREE_FAILURES.device - 1
    expect(scopesLockedBy(stats)).toEqual(['device'])
    expect(scopesLockedBy(noFailures())).toEqual([])
  })

  it('takes advisory locks in a stable order', () => {
    const a = lockNames({ userId: 'u', ip: '1.2.3.4', deviceKey: 'd' })
    expect(a).toEqual([...a].sort())
    expect(lockNames({ userId: 'u', ip: '1.2.3.4', deviceKey: null })).toHaveLength(2)
  })
})

describe('POST /api/connections/redeem', () => {
  const pending = {
    id: 'inv1',
    parentId: 'par1',
    code: 'ABCDEFGHJK',
    status: 'pending',
    createdAt: new Date(T0 - 16 * MIN),
    expiresAt: new Date(T0 - 16 * MIN + INVITE_VALIDITY_MS),
    childId: null,
  }

  it('redeems a valid code after more than 15 minutes (fake clock)', async () => {
    // Invite created 16 minutes ago: claim succeeds, no link yet → insert.
    h.results.push(...lockRows(3), statsRow(), [{ ...pending, status: 'accepted' }], [])
    const res = await redeemPost(req({ code: 'abcde-fghjk' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(h.updates[0]).toMatchObject({ status: 'accepted', childId: 'kid1' })
    expect(h.inserted[0].values).toMatchObject({ parentId: 'par1', childId: 'kid1' })
    expect(failures()).toHaveLength(0)
  })

  it('refuses a code once 7 days have passed (fake clock), logs it', async () => {
    vi.setSystemTime(pending.expiresAt.getTime() + MIN)
    // Claim finds nothing (expires_at <= now); lookup shows it still pending.
    h.results.push(...lockRows(3), statsRow(), [], [pending])
    const res = await redeemPost(req({ code: 'ABCDEFGHJK' }))
    expect(res.status).toBe(410)
    expect((await res.json()).errorCode).toBe('expired')
    expect(h.updates).toContainEqual({ status: 'expired' })
    expect(failures()[0]).toMatchObject({
      userId: 'kid1',
      ipAddress: '198.51.100.9',
      eventMetadata: expect.objectContaining({ reason: 'expired', inviteId: 'inv1' }),
    })
  })

  it('is single-use: a second child gets "used"', async () => {
    h.profile = { id: 'kid2', role: 'child' }
    h.results.push(
      ...lockRows(3),
      statsRow(),
      [],
      [{ ...pending, status: 'accepted', childId: 'kid1' }]
    )
    const res = await redeemPost(req({ code: 'ABCDEFGHJK' }))
    expect(res.status).toBe(409)
    expect((await res.json()).errorCode).toBe('used')
    expect(failures()[0].eventMetadata).toMatchObject({ reason: 'used' })
  })

  it('answers a retry by the same child with the existing link, not a failure', async () => {
    h.results.push(
      ...lockRows(3),
      statsRow(),
      [],
      [{ ...pending, status: 'accepted', childId: 'kid1' }],
      [{ id: 'rel1' }]
    )
    const res = await redeemPost(req({ code: 'ABCDEFGHJK' }))
    expect(await res.json()).toMatchObject({ success: true, relationshipId: 'rel1' })
    expect(failures()).toHaveLength(0)
  })

  it('refuses a revoked code', async () => {
    h.results.push(...lockRows(3), statsRow(), [], [{ ...pending, status: 'cancelled' }])
    const res = await redeemPost(req({ code: 'ABCDEFGHJK' }))
    expect(res.status).toBe(410)
    expect((await res.json()).errorCode).toBe('revoked')
  })

  it('logs unknown and malformed codes with a pseudonymous device key', async () => {
    h.results.push(...lockRows(3), statsRow(), [], [])
    const res = await redeemPost(req({ code: 'ZZZZZ-ZZZZZ' }))
    expect(res.status).toBe(404)
    expect((await res.json()).errorCode).toBe('invalid')

    h.results.push(...lockRows(3), statsRow())
    const bad = await redeemPost(req({ code: '123456' }))
    expect((await bad.json()).errorCode).toBe('invalid')

    const [a, b] = failures()
    expect(a.eventMetadata).toMatchObject({ reason: 'not_found', source: 'android' })
    expect(b.eventMetadata).toMatchObject({ reason: 'invalid_format' })
    const key = (a.eventMetadata as { deviceKey: string }).deviceKey
    expect(key).toMatch(/^[0-9a-f]{32}$/)
    expect(key).not.toContain('0123456789abcdef')
  })

  it('locks the account after 5 failures and does not look at the code', async () => {
    h.results.push(...lockRows(3), statsRow({ account_n: 5, account_age: 60 }))
    const res = await redeemPost(req({ code: 'ABCDEFGHJK' }))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.errorCode).toBe('rate_limited')
    // 15 min lock, last failure 60 s ago.
    expect(body.retryAfterSeconds).toBe(15 * 60 - 60)
    expect(res.headers.get('Retry-After')).toBe(String(15 * 60 - 60))
    expect(h.updates).toHaveLength(0)
    expect(h.inserted).toHaveLength(0) // a blocked attempt does not extend the lock
  })

  it('backs off: the 7th failure in 24 h locks for an hour', async () => {
    h.results.push(...lockRows(3), statsRow({ account_n: 7, account_age: 0 }))
    const res = await redeemPost(req({ code: 'ABCDEFGHJK' }))
    expect((await res.json()).retryAfterSeconds).toBe(60 * 60)
  })

  it('locks by device and by IP independently of the account', async () => {
    h.results.push(...lockRows(3), statsRow({ device_n: 5, device_age: 10 }))
    expect((await redeemPost(req({ code: 'ABCDEFGHJK' }))).status).toBe(429)
    h.results.push(...lockRows(3), statsRow({ ip_n: 30, ip_age: 10 }))
    expect((await redeemPost(req({ code: 'ABCDEFGHJK' }))).status).toBe(429)
    h.results.push(...lockRows(3), statsRow({ ip_n: 29, ip_age: 10 }), [], [])
    expect((await redeemPost(req({ code: 'ABCDEFGHJK' }))).status).toBe(404)
  })

  it('writes a lockout event on the failure that reaches the limit', async () => {
    h.results.push(...lockRows(3), statsRow({ account_n: 4, account_age: 30 }), [], [])
    await redeemPost(req({ code: 'ABCDEFGHJK' }))
    const lockout = h.inserted.find((r) => r.values.eventType === 'account_lockout')
    expect(lockout?.values).toMatchObject({
      severity: 'warning',
      eventMetadata: expect.objectContaining({ scope: 'invite_redeem', locked: ['account'] }),
    })
  })

  it('refuses a parallel attempt while another redeem for the same key runs', async () => {
    h.results.push([{ ok: true }], [{ ok: false }])
    const res = await redeemPost(req({ code: 'ABCDEFGHJK' }))
    expect(res.status).toBe(429)
    expect((await res.json()).errorCode).toBe('busy')
    expect(h.inserted).toHaveLength(0)
  })

  it('has no device key for web requests and still limits account and IP', async () => {
    h.results.push(...lockRows(2), statsRow({ account_n: 5, account_age: 1 }))
    const res = await redeemPost(
      req({ code: 'ABCDEFGHJK' }, { 'x-device-id': '', 'x-platform': '' })
    )
    expect(res.status).toBe(429)
  })

  it('only lets children redeem', async () => {
    h.profile = { id: 'par1', role: 'parent' }
    expect((await redeemPost(req({ code: 'ABCDEFGHJK' }))).status).toBe(403)
  })
})

describe('POST /api/connections/invite', () => {
  const parentReq = (body: unknown) =>
    new NextRequest('http://localhost/api/connections/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  beforeEach(() => {
    h.profile = { id: 'par1', role: 'parent' }
  })

  it('creates a 50-bit code valid for 7 days', async () => {
    h.results.push([]) // no live invite
    h.results.push([{ id: 'inv9', code: 'X', expiresAt: new Date(), status: 'pending' }])
    const res = await invitePost(parentReq({}))
    expect((await res.json()).reused).toBe(false)
    const values = h.inserted[0].values
    expect(values.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{10}$/)
    expect((values.expiresAt as Date).getTime()).toBe(T0 + 7 * 24 * 60 * MIN)
  })

  it('ignores an old app asking for 15 minutes', async () => {
    h.results.push([], [{ id: 'inv9' }])
    await invitePost(parentReq({ expiresInMinutes: 15 }))
    expect((h.inserted[0].values.expiresAt as Date).getTime()).toBe(T0 + INVITE_VALIDITY_MS)
  })

  it('returns the live invite instead of piling up codes', async () => {
    h.results.push([{ id: 'inv1', code: 'ABCDEFGHJK', status: 'pending' }])
    const body = await (await invitePost(parentReq({}))).json()
    expect(body).toMatchObject({ reused: true, invite: { id: 'inv1' } })
    expect(h.inserted).toHaveLength(0)
  })

  it('replace revokes the live invite and issues a new one', async () => {
    h.results.push([], [{ id: 'inv2' }])
    const body = await (await invitePost(parentReq({ replace: true }))).json()
    expect(h.updates[0]).toEqual({ status: 'cancelled' })
    expect(body.reused).toBe(false)
  })

  it('only lets parents invite', async () => {
    h.profile = { id: 'kid1', role: 'child' }
    expect((await invitePost(parentReq({}))).status).toBe(403)
  })
})

describe('POST /api/connections/invite/revoke', () => {
  const revokeReq = (body: unknown) =>
    new NextRequest('http://localhost/api/connections/invite/revoke', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('cancels the parent’s own pending invite', async () => {
    h.profile = { id: 'par1', role: 'parent' }
    h.results.push([{ id: 'inv1' }])
    const res = await revokePost(revokeReq({ inviteId: 'inv1' }))
    expect(res.status).toBe(200)
    expect(h.updates[0]).toEqual({ status: 'cancelled' })
  })

  it('answers 404 for an invite that is not theirs or no longer pending', async () => {
    h.profile = { id: 'par1', role: 'parent' }
    h.results.push([])
    expect((await revokePost(revokeReq({ inviteId: 'other' }))).status).toBe(404)
  })

  it('does not let a child revoke', async () => {
    h.profile = { id: 'kid1', role: 'child' }
    expect((await revokePost(revokeReq({ inviteId: 'inv1' }))).status).toBe(403)
  })
})
