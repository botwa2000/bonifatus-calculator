import Link from 'next/link'

const mockStats = {
  bonusBalance: 42.5,
  lastTest: { subject: 'Math', grade: 'A', bonus: 6.0, date: '2025-02-10' },
}

const mockRecent = [
  { subject: 'Science', grade: 'B', bonus: 4.5, date: '2025-02-05' },
  { subject: 'English', grade: 'A', bonus: 5.5, date: '2025-01-28' },
]

const quickActions = [
  { label: 'Add a grade', href: '#', tone: 'primary' },
  { label: 'See history', href: '#', tone: 'ghost' },
  { label: 'Invite parent', href: '#', tone: 'ghost' },
]

export default function StudentDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-4 py-3 shadow-sm">
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
          >
            ← Back to homepage
          </Link>
          <div className="flex gap-3 text-sm">
            <Link
              href="/profile"
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-md transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Student dashboard</p>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Welcome back</h1>
            <p className="text-neutral-600 dark:text-neutral-300">
              Track your grades and bonus points. Add new tests and see your progress.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={
                  action.tone === 'primary'
                    ? 'px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all'
                    : 'px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white font-semibold hover:border-primary-400 dark:hover:border-primary-500 transition-all'
                }
              >
                {action.label}
              </a>
            ))}
          </div>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-primary-50/60 dark:from-neutral-900 dark:to-neutral-800 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Bonus balance</p>
                <p className="text-4xl font-bold text-primary-600 dark:text-primary-300">
                  {mockStats.bonusBalance.toFixed(1)} pts
                </p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                On track
              </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Keep adding grades to grow your bonus balance and stay motivated.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-lg transition-all">
              Add a grade
            </button>
          </div>

          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-6 space-y-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Last test</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {mockStats.lastTest.subject}
                </p>
                <p className="text-xs text-neutral-500">{mockStats.lastTest.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-700 dark:text-neutral-200">
                  Grade: {mockStats.lastTest.grade}
                </p>
                <p className="text-primary-600 dark:text-primary-300 font-semibold">
                  +{mockStats.lastTest.bonus.toFixed(1)} pts
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/70 p-3 text-sm text-neutral-700 dark:text-neutral-200">
              Tip: focus on core subjects for higher multipliers. Ask a parent to review your plan.
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Recent grades & bonuses
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Your latest entries</p>
            </div>
            <button className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3 text-sm">
            {mockRecent.map((item) => (
              <div
                key={`${item.subject}-${item.date}`}
                className="flex items-center justify-between rounded-2xl border border-neutral-100 dark:border-neutral-800 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/70"
              >
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{item.subject}</p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-neutral-700 dark:text-neutral-200 text-sm">
                    Grade: {item.grade}
                  </p>
                  <p className="text-primary-600 dark:text-primary-300 font-semibold">
                    +{item.bonus.toFixed(1)} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
