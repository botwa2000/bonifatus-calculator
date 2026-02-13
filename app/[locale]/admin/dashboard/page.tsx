import {
  getAdminStats,
  getGradeStats,
  getAllUsers,
  getRecentSecurityEvents,
} from '@/lib/db/queries/admin'
import { setRequestLocale, getTranslations } from 'next-intl/server'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const tc = await getTranslations('common')

  const defaultStats = {
    totalUsers: 0,
    parents: 0,
    children: 0,
    admins: 0,
    totalTerms: 0,
    totalBonusPoints: 0,
    activeRelationships: 0,
    registrationsThisWeek: 0,
    registrationsThisMonth: 0,
    pendingVerifications: 0,
  }
  const defaultGradeStats = {
    avgBonusPoints: 0,
    mostUsedGradingSystem: null as string | null,
    termsBySchoolYear: [] as { schoolYear: string; count: number }[],
  }

  let stats = defaultStats
  let gradeStats = defaultGradeStats
  let users: Awaited<ReturnType<typeof getAllUsers>> = []
  let securityEvents: Awaited<ReturnType<typeof getRecentSecurityEvents>> = []

  try {
    ;[stats, gradeStats, users, securityEvents] = await Promise.all([
      getAdminStats(),
      getGradeStats(),
      getAllUsers(),
      getRecentSecurityEvents(10),
    ])
  } catch (error) {
    console.error('[Admin Dashboard] Failed to load data:', error)
  }

  const recentUsers = users.slice(0, 10)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
        {t('dashboardTitle')}
      </h1>

      {/* Overview Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label={t('totalUsers')}
          value={stats.totalUsers}
          sub={`${stats.parents}P / ${stats.children}C / ${stats.admins}A`}
        />
        <StatCard label={t('activeConnections')} value={stats.activeRelationships} />
        <StatCard label={t('savedTerms')} value={stats.totalTerms} />
        <StatCard label={t('bonusPoints')} value={Math.round(stats.totalBonusPoints)} />
        <StatCard label={t('newThisWeek')} value={stats.registrationsThisWeek} />
        <StatCard label={t('pendingVerification')} value={stats.pendingVerifications} />
      </div>

      {/* Recent Users */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
          {t('recentUsers')}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('name')}
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('email')}
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('role')}
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('joined')}
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('verified')}
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('terms')}
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('connections')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                    {u.fullName}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${u.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    {u.termsCount}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    {u.connectionsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grade Insights */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
          {t('gradeInsights')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InsightCard
            label={t('mostUsedSystem')}
            value={gradeStats.mostUsedGradingSystem ?? 'N/A'}
          />
          <InsightCard label={t('avgBonusPerTerm')} value={gradeStats.avgBonusPoints.toFixed(1)} />
          <InsightCard
            label={t('termsByYear')}
            value={
              gradeStats.termsBySchoolYear
                .map((item) => `${item.schoolYear}: ${item.count}`)
                .join(', ') || 'N/A'
            }
          />
        </div>
      </section>

      {/* Recent Security Events */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
          {t('recentSecurity')}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('time')}
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('type')}
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('severity')}
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('ip')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {securityEvents.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                    {e.eventType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={e.severity} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-300">
                    {e.ipAddress}
                  </td>
                </tr>
              ))}
              {securityEvents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                    {t('noSecurityEvents')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Placeholder Sections */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
          {tc('comingSoon')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PlaceholderCard
            title={t('subscriptionTiers')}
            description={t('subscriptionDesc')}
            comingSoon={tc('comingSoon')}
          />
          <PlaceholderCard
            title={t('emailTemplates')}
            description={t('emailTemplatesDesc')}
            comingSoon={tc('comingSoon')}
          />
          <PlaceholderCard
            title={t('systemConfig')}
            description={t('systemConfigDesc')}
            comingSoon={tc('comingSoon')}
          />
          <PlaceholderCard
            title={t('analytics')}
            description={t('analyticsDesc')}
            comingSoon={tc('comingSoon')}
          />
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>}
    </div>
  )
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{value}</p>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    parent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    child: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  }
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colors[role] ?? 'bg-neutral-100 text-neutral-700'}`}
    >
      {role}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colors[severity] ?? 'bg-neutral-100 text-neutral-700'}`}
    >
      {severity}
    </span>
  )
}

function PlaceholderCard({
  title,
  description,
  comingSoon,
}: {
  title: string
  description: string
  comingSoon: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-800/50">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{title}</h3>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
          {comingSoon}
        </span>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  )
}
