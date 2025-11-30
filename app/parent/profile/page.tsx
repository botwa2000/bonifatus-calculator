export default function ParentProfilePage() {
  const mockChildren = [
    { name: 'Alex', schoolYear: '2025-2026', lastBonus: 6.0 },
    { name: 'Mia', schoolYear: '2024-2025', lastBonus: 4.5 },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">Parent profile</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Your settings</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Manage your preferences and linked children. Track their progress from one place.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Preferences</h2>
          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="text-neutral-700 dark:text-neutral-300">Language</span>
              <select className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2">
                <option>English</option>
                <option>German</option>
                <option>French</option>
              </select>
            </label>
            <label className="block">
              <span className="text-neutral-700 dark:text-neutral-300">Theme</span>
              <select className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2">
                <option>System</option>
                <option>Light</option>
                <option>Dark</option>
              </select>
            </label>
            <label className="block">
              <span className="text-neutral-700 dark:text-neutral-300">Notifications</span>
              <select className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2">
                <option>Email + in-app</option>
                <option>Email only</option>
                <option>Mute</option>
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Linked children
          </h2>
          <div className="space-y-3 text-sm">
            {mockChildren.map((child) => (
              <div
                key={child.name}
                className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{child.name}</p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                    {child.schoolYear}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-neutral-700 dark:text-neutral-200 text-sm">Last bonus</p>
                  <p className="text-primary-600 dark:text-primary-300 font-semibold">
                    +{child.lastBonus.toFixed(1)} pts
                  </p>
                </div>
              </div>
            ))}
            <button className="w-full rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm text-primary-600 dark:text-primary-300 font-semibold">
              + Connect a child account
            </button>
            <p className="text-xs text-neutral-500">
              Linking lets you view grades, bonuses, and progress for each child.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
