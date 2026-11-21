/**
 * Sign-in, sign-up and code checks must answer the same way whether or not an email
 * has an account (see lib/auth/credentials.ts). The database is faked: each awaited
 * query takes the next queued result.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  const results: unknown[][] = []
  const writes: string[] = []
  const chain = (): unknown =>
    new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === 'then') {
            const value = results.length ? results.shift() : []
            return (resolve: (v: unknown) => void) => resolve(value)
          }
          return () => chain()
        },
      }
    )
  const write = (kind: string) => () => {
    writes.push(kind)
    return chain()
  }
  const db = {
    select: () => chain(),
    insert: write('insert'),
    update: write('update'),
    delete: write('delete'),
    transaction: async (fn: (tx: unknown) => Promise<void>) => {
      writes.push('transaction')
      await fn({ insert: () => chain() })
    },
  }
  return { results, writes, db, afterTasks: [] as Array<() => unknown> }
})

vi.mock('@/lib/db/client', () => ({ db: h.db, pool: { query: vi.fn() } }))
vi.mock('@/lib/db/queries/security', () => ({ logSecurityEvent: vi.fn(async () => {}) }))
vi.mock('@/lib/email/service', () => ({ sendEmail: vi.fn(async () => true) }))
vi.mock('@/lib/auth/turnstile', () => ({
  getClientIp: () => '203.0.113.7',
  verifyTurnstileToken: vi.fn(async () => ({ success: true })),
}))
vi.mock('@/lib/auth/validate-mobile-token', () => ({ validateMobileToken: () => true }))
vi.mock('@/lib/auth/password-validation', () => ({
  validatePassword: async () => ({ isValid: true, errors: [] }),
}))
vi.mock('@/lib/stats/with-action-log', () => ({
  withActionLog: (_a: string, handler: unknown) => handler,
  noteAction: (res: Response) => res,
}))
vi.mock('next/server', async (orig) => ({
  ...(await orig<typeof import('next/server')>()),
  after: (task: () => unknown) => h.afterTasks.push(task),
}))

import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { logSecurityEvent } from '@/lib/db/queries/security'
import { emailKey, passwordSignIn } from '@/lib/auth/credentials'

const ctx = { ip: '203.0.113.7', userAgent: null, source: 'mobile' as const }
const hash = bcrypt.hashSync('correct horse battery', 4)
const verifiedUser = { id: 'u1', email: 'a@example.com', password: hash, emailVerified: new Date() }

beforeEach(() => {
  h.results.length = 0
  h.writes.length = 0
  h.afterTasks.length = 0
  vi.mocked(logSecurityEvent).mockClear()
})

describe('passwordSignIn', () => {
  const run = async (user: object | null, password = 'wrong guess here') => {
    // IP failures, email failures, user lookup
    h.results.push([{ n: 0 }], [{ n: 0 }], user ? [user] : [])
    const spy = vi.spyOn(bcrypt, 'compare')
    const result = await passwordSignIn('A@Example.com ', password, ctx)
    const compares = spy.mock.calls.length
    spy.mockRestore()
    return { result, compares }
  }

  it('gives the same answer, after one bcrypt check, for every kind of failure', async () => {
    const cases = [
      { user: null, reason: 'user_not_found' },
      { user: { ...verifiedUser, password: null }, reason: 'no_password' },
      { user: verifiedUser, reason: 'wrong_password' },
    ]
    for (const c of cases) {
      vi.mocked(logSecurityEvent).mockClear()
      const { result, compares } = await run(c.user)
      // The reason travels to our logs only; the route must not pass it on (see below).
      expect(result).toEqual({
        status: 'invalid',
        reason: c.reason,
        userId: c.user ? 'u1' : null,
      })
      expect(compares).toBe(1)
      expect(vi.mocked(logSecurityEvent).mock.calls[0][0].metadata).toEqual({
        reason: c.reason,
        source: 'mobile',
        emailKey: emailKey('a@example.com'),
      })
    }
  })

  it('accepts the right password, and flags an unconfirmed account only then', async () => {
    expect((await run(verifiedUser, 'correct horse battery')).result.status).toBe('ok')
    const pending = { ...verifiedUser, emailVerified: null }
    vi.mocked(logSecurityEvent).mockClear()
    expect((await run(pending, 'correct horse battery')).result.status).toBe('unverified')
    // Logged for the stats, under a reason the lockout count ignores.
    expect(vi.mocked(logSecurityEvent).mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      metadata: { reason: 'email_unverified', source: 'mobile' },
    })
  })

  it('answers every refused password with the same HTTP response on mobile', async () => {
    const { POST } = await import('@/app/api/mobile/auth/signin/route')
    const bodies = new Set<string>()
    for (const user of [null, { ...verifiedUser, password: null }, verifiedUser]) {
      h.results.push([{ n: 0 }], [{ n: 0 }], user ? [user] : [])
      const res = await POST(
        new NextRequest('http://localhost/api/mobile/auth/signin', {
          method: 'POST',
          body: JSON.stringify({ email: 'a@example.com', password: 'wrong guess here' }),
        })
      )
      expect(res.status).toBe(401)
      bodies.add(await res.text())
    }
    expect(bodies.size).toBe(1)
    expect([...bodies][0]).not.toMatch(/reason|user_not_found|no_password|wrong_password/)
  })

  it('throttles per address before looking the address up', async () => {
    h.results.push([{ n: 0 }], [{ n: 10 }])
    expect(await passwordSignIn('nobody@example.com', 'x', ctx)).toEqual({ status: 'rate_limited' })
    expect(h.results).toHaveLength(0) // no user lookup happened
  })

  it('never stores the address itself', () => {
    expect(emailKey('A@Example.com ')).toBe(emailKey('a@example.com'))
    expect(emailKey('a@example.com')).not.toContain('example')
  })
})

const post = (url: string, body: object) =>
  new NextRequest('http://localhost' + url, { method: 'POST', body: JSON.stringify(body) })

describe('sign-up', () => {
  const body = { email: 'a@example.com', password: 'a long enough password', role: 'parent' }

  const register = async (existing: object | null) => {
    const { POST } = await import('@/app/api/auth/register/route')
    h.results.push(existing ? [existing] : [])
    const res = await POST(post('/api/auth/register', body))
    const json = await res.json()
    return { status: res.status, json, writes: [...h.writes], after: h.afterTasks.length }
  }

  it('answers a registered address exactly like a new one', async () => {
    const fresh = await register(null)
    h.writes.length = 0
    h.afterTasks.length = 0
    const taken = await register({ id: 'u1', emailVerified: new Date(), password: 'x' })

    expect(taken.status).toBe(fresh.status)
    expect(Object.keys(taken.json).sort()).toEqual(Object.keys(fresh.json).sort())
    expect(taken.json.userId).toMatch(/^[0-9a-f-]{36}$/)
    expect(taken.json.userId).not.toBe('u1')
    expect(fresh.writes).toContain('transaction')
    expect(taken.writes).toEqual([]) // nothing created or changed
    expect(taken.after).toBe(1) // the owner gets told by email, after the response
  })

  it('keeps a pending sign-up instead of deleting or overwriting it', async () => {
    const pending = await register({ id: 'u2', emailVerified: null, password: 'x' })
    expect(pending.status).toBe(200)
    expect(pending.json.userId).toBe('u2')
    expect(pending.writes).toEqual([])
  })
})

describe('codes', () => {
  it('rejects an unknown sign-up id the same way as a wrong code', async () => {
    const { POST } = await import('@/app/api/auth/verify-email/route')
    const id = '00000000-0000-4000-8000-000000000000'
    h.results.push([])
    const unknown = await POST(post('/api/auth/verify-email', { userId: id, code: '123456' }))
    h.results.push([
      {
        id: 'c',
        code: '654321',
        attemptCount: 0,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() + 60_000),
      },
    ])
    const wrong = await POST(post('/api/auth/verify-email', { userId: id, code: '123456' }))
    h.results.push([
      {
        id: 'c',
        code: '123456',
        attemptCount: 5,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() + 60_000),
      },
    ])
    const usedUp = await POST(post('/api/auth/verify-email', { userId: id, code: '123456' }))
    const bodies = await Promise.all([unknown, wrong, usedUp].map((r) => r.json()))
    expect([unknown.status, wrong.status, usedUp.status]).toEqual([400, 400, 400])
    expect(bodies[1]).toEqual(bodies[0])
    expect(bodies[2]).toEqual(bodies[0])
  })

  it('resend answers before looking anything up', async () => {
    const { POST } = await import('@/app/api/auth/resend-code/route')
    const res = await POST(
      post('/api/auth/resend-code', { userId: '00000000-0000-4000-8000-000000000000' })
    )
    expect(res.status).toBe(200)
    expect(h.afterTasks).toHaveLength(1)
    expect(h.writes).toEqual([])
  })

  it('forgot-password answers before looking anything up', async () => {
    const { POST } = await import('@/app/api/auth/forgot-password/route')
    const res = await POST(post('/api/auth/forgot-password', { email: 'a@example.com' }))
    expect(res.status).toBe(200)
    expect(h.afterTasks).toHaveLength(1)
  })
})
