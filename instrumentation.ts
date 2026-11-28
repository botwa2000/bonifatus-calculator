/**
 * Server start hook (Next.js instrumentation). Runs once per Node.js server
 * process: schedules the nightly store import, the usage-stats retention
 * purge (raw text 30 days, events 13 months, visitor-hash salts 2 days) and the
 * Zeugnis-Erinnerung mails (every 10 minutes; lib/reminders/zeugnis.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.DATABASE_URL) return
  // `next build` also loads this file; only a running server schedules work.
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  const { startStoreImports } = await import('@/lib/stats/store-import')
  const { purgeUsage } = await import('@/lib/stats/usage')
  const { startZeugnisReminders } = await import('@/lib/reminders/zeugnis')

  startStoreImports()
  startZeugnisReminders()
  purgeUsage()
  setInterval(purgeUsage, 6 * 60 * 60 * 1000).unref()

  // Store reviewers' demo family: recreated within the hour if a reviewer deletes it.
  if (process.env.APPREVIEW_PASSWORD) {
    const { ensureReviewAccounts } = await import('@/lib/review/demo-account')
    const ensure = () =>
      ensureReviewAccounts()
        .then((r) => {
          if (r.status === 'ok' && (r.rebuilt || r.passwordSynced))
            console.log('[review] demo accounts', r)
        })
        .catch((e) => console.error('[review] demo accounts:', (e as Error).message))
    ensure()
    setInterval(ensure, 60 * 60 * 1000).unref()
  }
}
