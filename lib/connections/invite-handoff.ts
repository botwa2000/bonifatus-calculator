import { normalizeInviteCode } from './invite-code'

/**
 * Carries a parent's invite code through sign-in and sign-up on the web, so a child who
 * opens the invite link without an account ends up on the Connections tab with the code
 * filled in (the child still confirms; the link alone never connects).
 *
 *   /invite?code=X ─ log in ───────────────────────────────┐
 *                  └ register?invite=X ─ email or Google ──┤→ /dashboard?invite=X
 *   /dashboard?invite=X: new Google user → /auth/google-profile?invite=X → /dashboard?invite=X
 *                        child           → /profile?tab=connections&code=X
 */
export const INVITE_PARAM = 'invite'

/** The canonical code from a query string ("?invite=…"), or null. */
export function inviteFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(INVITE_PARAM)
  return raw ? normalizeInviteCode(raw) : null
}

/** Where to go after signing in or up: the dashboard router, with the invite if any. */
export function afterAuthPath(code: string | null): string {
  return code ? `/dashboard?${INVITE_PARAM}=${code}` : '/dashboard'
}

/** The child's Connections tab with the code filled in. */
export function connectPath(code: string): string {
  return `/profile?tab=connections&code=${code}`
}

/** A same-site path to continue to after sign-in ("/…", never "//host" or a URL). */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  return next && /^\/(?![/\\])/.test(next) && !next.includes('\\') ? next : fallback
}
