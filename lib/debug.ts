/**
 * Environment-based debug logging utility.
 *
 * Levels (controlled by NEXT_PUBLIC_DEBUG_LEVEL):
 *   "verbose" — all messages (dev)
 *   "basic"   — warnings + errors only (staging / light prod)
 *   "none"    — silent (prod default)
 *
 * Usage:
 *   import { dbg, dbgWarn, dbgError } from '@/lib/debug'
 *   dbg('auth', 'token obtained', { tokenLength: token.length })
 *   dbgWarn('middleware', 'fallback locale used')
 *   dbgError('login', 'signIn threw', { err })
 *
 * Server-side (middleware, auth.ts, route handlers) logs to stdout.
 * Client-side logs to the browser console.
 */

type DebugLevel = 'verbose' | 'basic' | 'none'

const RAW_LEVEL = (
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEBUG_LEVEL : undefined
) as string | undefined

const LEVEL: DebugLevel =
  RAW_LEVEL === 'verbose' || RAW_LEVEL === 'basic' || RAW_LEVEL === 'none' ? RAW_LEVEL : 'none'

function ts(): string {
  return new Date().toISOString()
}

/** Verbose debug — only in "verbose" mode */
export function dbg(module: string, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL !== 'verbose') return
  const prefix = `[dbg:${module}]`
  if (meta) {
    console.info(prefix, ts(), message, meta)
  } else {
    console.info(prefix, ts(), message)
  }
}

/** Warning — "verbose" and "basic" */
export function dbgWarn(module: string, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL === 'none') return
  const prefix = `[warn:${module}]`
  if (meta) {
    console.warn(prefix, ts(), message, meta)
  } else {
    console.warn(prefix, ts(), message)
  }
}

/** Error — always logged (except "none") */
export function dbgError(module: string, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL === 'none') return
  const prefix = `[err:${module}]`
  if (meta) {
    console.error(prefix, ts(), message, meta)
  } else {
    console.error(prefix, ts(), message)
  }
}
