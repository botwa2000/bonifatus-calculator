import {
  getAdminStats,
  getGradeStats,
  getAllUsers,
  getRecentSecurityEvents,
} from '@/lib/db/queries/admin'

export default async function AdminDashboardPage() {
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
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">Admin Dashboard</h1>

      {/* Overview Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          sub={`${stats.parents}P / ${stats.children}C / ${stats.admins}A`}
        />
        <StatCard label="Active Connections" value={stats.activeRelationships} />
        <StatCard label="Saved Terms" value={stats.totalTerms} />
        <StatCard label="Bonus Points" value={Math.round(stats.totalBonusPoints)} />
        <StatCard label="New This Week" value={stats.registrationsThisWeek} />
        <StatCard label="Pending Verification" value={stats.pendingVerifications} />
      </div>

      {/* Recent Users */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
          Recent Users
        </h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Name
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Email
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Role
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Joined
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Verified
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Terms
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Connections
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
          Grade Insights
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InsightCard
            label="Most Used Grading System"
            value={gradeStats.mostUsedGradingSystem ?? 'N/A'}
          />
          <InsightCard label="Avg Bonus Points/Term" value={gradeStats.avgBonusPoints.toFixed(1)} />
          <InsightCard
            label="Terms by School Year"
            value={
              gradeStats.termsBySchoolYear.map((t) => `${t.schoolYear}: ${t.count}`).join(', ') ||
              'N/A'
            }
          />
        </div>
      </section>

      {/* Recent Security Events */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
          Recent Security Events
        </h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Time
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Type
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                  Severity
                </th>
                <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">IP</th>
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
                    No security events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Placeholder Sections */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">Coming Soon</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PlaceholderCard
            title="Subscription Tiers"
            description="Manage free/premium plans, user limits, feature flags"
          />
          <PlaceholderCard
            title="Email Templates"
            description="Edit verification, password reset, invite, and marketing emails"
          />
          <PlaceholderCard
            title="System Configuration"
            description="Grading systems, subjects, bonus factor defaults"
          />
          <PlaceholderCard
            title="Analytics"
            description="Usage charts, retention metrics, funnel visualization"
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

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-800/50">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{title}</h3>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
          Coming Soon
        </span>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  )
}
