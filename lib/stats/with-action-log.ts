/**
 * Wraps a core-action route handler so every request lands in action_log
 * (platform, version, entry point, outcome, latency, provider, result id) for
 * /admin/stats. The handler itself is untouched; logging is fire-and-forget.
 *
 *   export const POST = withActionLog('grade_quick_save', handlePost, {
 *     resultId: (body) => body?.quickGrade?.id,
 *   })
 */
import { requireAuthApi } from '@/lib/auth/session'
import { recordAction, requestContext, type Outcome } from '@/lib/stats/usage'

type Handler<R extends Request> = (req: R) => Promise<Response>

interface Options {
  provider?: string
  /** Picks the created row's id out of a successful JSON response body. */
  resultId?: (body: Record<string, unknown>) => unknown
  /** Sign-in / sign-up: the account the response is for (no session exists yet). */
  userId?: (body: Record<string, unknown>) => unknown
}

type Picked = { resultId: unknown; userId: unknown }

export function outcomeOf(status: number): Outcome {
  if (status < 400) return 'ok'
  if (status === 401 || status === 403) return 'denied'
  if (status === 404) return 'not_found'
  if (status === 429) return 'rate_limited'
  if (status < 500) return 'invalid'
  return 'fail'
}

export function withActionLog<R extends Request>(
  action: string,
  handler: Handler<R>,
  opts: Options = {}
): Handler<R> {
  return async (req: R) => {
    const started = performance.now()
    // Resolved inside the request scope (next/headers), consumed after the response.
    const user = requireAuthApi().catch(() => null)
    let res: Response
    try {
      res = await handler(req)
    } catch (err) {
      log(req, user, action, opts, 500, started, { resultId: null, userId: null })
      throw err
    }
    const picked: Picked = { resultId: null, userId: null }
    if (res.ok && (opts.resultId || opts.userId)) {
      try {
        const body = await res.clone().json()
        picked.resultId = opts.resultId?.(body) ?? null
        picked.userId = opts.userId?.(body) ?? null
      } catch {
        /* non-JSON body: nothing to pick */
      }
    }
    log(req, user, action, opts, res.status, started, picked)
    return res
  }
}

function log(
  req: Request,
  userPromise: Promise<{ id?: string } | null>,
  action: string,
  opts: Options,
  status: number,
  started: number,
  picked: Picked
) {
  const latencyMs = performance.now() - started
  ;(async () => {
    const user = await userPromise
    const userId = typeof picked.userId === 'string' ? picked.userId : (user?.id ?? null)
    const ctx = await requestContext(req.headers, { userId })
    const { resultId } = picked
    recordAction(ctx, {
      action,
      outcome: outcomeOf(status),
      statusCode: status,
      latencyMs,
      provider: opts.provider ?? null,
      resultId:
        typeof resultId === 'string' || typeof resultId === 'number' ? String(resultId) : null,
      source: req.headers.get('x-source'),
    })
  })().catch((err) => console.error('[usage] action log failed:', (err as Error).message))
}
