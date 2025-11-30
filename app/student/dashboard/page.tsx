export default function StudentDashboardPage() {
  const mockStats = {
    bonusBalance: 42.5,
    lastTest: { subject: 'Math', grade: 'A', bonus: 6.0, date: '2025-02-10' },
  }
  const mockRecent = [
    { subject: 'Science', grade: 'B', bonus: 4.5, date: '2025-02-05' },
    { subject: 'English', grade: 'A', bonus: 5.5, date: '2025-01-28' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">Student dashboard</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Welcome back</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Track your grades and bonus points. Add new tests and see your progress.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3 shadow-sm">
          <p className="text-sm text-neutral-500">Bonus balance</p>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-300">
            {mockStats.bonusBalance.toFixed(1)} pts
          </p>
          <button className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-button hover:shadow-lg transition-all">
            Add a grade
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2 shadow-sm">
          <p className="text-sm text-neutral-500">Last test</p>
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
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Recent grades & bonuses
            </h2>
            <p className="text-sm text-neutral-500">Your latest entries</p>
          </div>
          <button className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline">
            View all
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {mockRecent.map((item) => (
            <div
              key={`${item.subject}-${item.date}`}
              className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2"
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
  )
}
