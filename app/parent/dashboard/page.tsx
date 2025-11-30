export default function ParentDashboardPage() {
  const mockChildren = [
    { name: 'Alex', schoolYear: '2025-2026', lastTest: 'Math A (+6.0)', balance: 42.5 },
    { name: 'Mia', schoolYear: '2024-2025', lastTest: 'Science B (+4.5)', balance: 31.0 },
  ]
  const mockActivity = [
    { child: 'Alex', event: 'Added grade Math A', bonus: '+6.0 pts', date: '2025-02-10' },
    { child: 'Mia', event: 'Added grade Science B', bonus: '+4.5 pts', date: '2025-02-05' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">Parent dashboard</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Family overview</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Monitor linked children, see recent activity, and add or review grades.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        {mockChildren.map((child) => (
          <div
            key={child.name}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3 shadow-sm"
          >
            <p className="text-sm text-neutral-500">{child.schoolYear}</p>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{child.name}</h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-200">
              Last test: {child.lastTest}
            </p>
            <p className="text-primary-600 dark:text-primary-300 font-semibold">
              Balance: {child.balance.toFixed(1)} pts
            </p>
            <div className="flex gap-2 text-sm">
              <button className="px-3 py-2 rounded-lg bg-primary-600 text-white font-semibold">
                View
              </button>
              <button className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white">
                Add grade
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Recent activity
            </h2>
            <p className="text-sm text-neutral-500">Latest grades and bonuses from your children</p>
          </div>
          <button className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline">
            View all
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {mockActivity.map((item, idx) => (
            <div
              key={`${item.child}-${idx}`}
              className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2"
            >
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {item.child}: {item.event}
                </p>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs">{item.date}</p>
              </div>
              <p className="text-primary-600 dark:text-primary-300 font-semibold">{item.bonus}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
