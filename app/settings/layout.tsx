import { requireAuth } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">{children}</main>
    </div>
  )
}
