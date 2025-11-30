const mockChildren = [
  { name: 'Alex', schoolYear: '2025-2026', lastTest: 'Math A (+6.0)', balance: 42.5 },
  { name: 'Mia', schoolYear: '2024-2025', lastTest: 'Science B (+4.5)', balance: 31.0 },
]

const mockActivity = [
  { child: 'Alex', event: 'Added grade Math A', bonus: '+6.0 pts', date: '2025-02-10' },
  { child: 'Mia', event: 'Added grade Science B', bonus: '+4.5 pts', date: '2025-02-05' },
]

const quickLinks = [
  { label: 'Add Grade', href: '#', tone: 'primary' },
  { label: 'View Children', href: '#', tone: 'ghost' },
  { label: 'Invite Co-Parent', href: '#', tone: 'ghost' },
]

export default function ParentDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Top bar */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Parent dashboard</p>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Family overview</h1>
            <p className="text-neutral-600 dark:text-neutral-300">
              Monitor linked children, see recent activity, and add or review grades.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={
                  link.tone === 'primary'
                    ? 'px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all'
                    : 'px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white font-semibold hover:border-primary-400 dark:hover:border-primary-500 transition-all'
                }
              >
                {link.label}
              </a>
            ))}
          </div>
        </header>

        {/* Summary row */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-card p-5 flex flex-col gap-2">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total bonus balance</p>
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-300">€142.0</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Combined bonus points across all linked children.
            </p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-card p-5 flex flex-col gap-2">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Children linked</p>
            <p className="text-4xl font-bold text-neutral-900 dark:text-white">
              {mockChildren.length}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Manage permissions and add co-parents.
            </p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-card p-5 flex flex-col gap-2">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Recent bonus</p>
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-300">+6.0 pts</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Awarded on Alex&apos;s Math A test this week.
            </p>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
          {/* Children list */}
          <section className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Children</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Track balances, add grades, and open profiles.
                </p>
              </div>
              <a
                href="#"
                className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
              >
                Manage profiles
              </a>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {mockChildren.map((child) => (
                <div
                  key={child.name}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-primary-50/50 dark:from-neutral-900 dark:to-neutral-800 p-4 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-neutral-500">{child.schoolYear}</p>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {child.name}
                      </h3>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-200">
                    Last test: {child.lastTest}
                  </p>
                  <p className="text-primary-600 dark:text-primary-300 font-semibold">
                    Balance: {child.balance.toFixed(1)} pts
                  </p>
                  <div className="flex gap-2 text-sm">
                    <button className="px-3 py-2 rounded-lg bg-primary-600 text-white font-semibold shadow-button hover:shadow-md transition-all">
                      View profile
                    </button>
                    <button className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white">
                      Add grade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Activity */}
          <section className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  Recent activity
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Latest grades and bonuses from your children
                </p>
              </div>
              <a
                href="#"
                className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
              >
                View all
              </a>
            </div>
            <div className="space-y-3 text-sm">
              {mockActivity.map((item, idx) => (
                <div
                  key={`${item.child}-${idx}`}
                  className="flex items-center justify-between rounded-2xl border border-neutral-100 dark:border-neutral-800 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/70"
                >
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {item.child}: {item.event}
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs">{item.date}</p>
                  </div>
                  <p className="text-primary-600 dark:text-primary-300 font-semibold">
                    {item.bonus}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
