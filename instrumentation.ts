/**
 * Server start hook (Next.js instrumentation). Runs once per Node.js server
 * process: schedules the nightly store import and the usage-stats retention
 * purge (raw text 30 days, events 13 months, visitor-hash salts 2 days).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.DATABASE_URL) return
  // `next build` also loads this file; only a running server schedules work.
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  const { startStoreImports } = await import('@/lib/stats/store-import')
  const { purgeUsage } = await import('@/lib/stats/usage')

  startStoreImports()
  purgeUsage()
  setInterval(purgeUsage, 6 * 60 * 60 * 1000).unref()
}
