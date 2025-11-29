export default function StudentProfilePage() {
  const mockTests = [
    { subject: 'Math', grade: 'B', bonus: 4.5, date: '2025-02-10' },
    { subject: 'Science', grade: 'A', bonus: 6.0, date: '2025-02-05' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">Student profile</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Your settings</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Update your preferences and review recent grades and bonus points.
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
            <label className="block">
              <span className="text-neutral-700 dark:text-neutral-300">Default grading system</span>
              <select className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2">
                <option>0–100% (Global)</option>
                <option>A–F (US/CA/UK/AU)</option>
                <option>1–6 (Germany/Austria/Switzerland)</option>
                <option>15–0 (Germany Abitur)</option>
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Recent tests & bonuses
          </h2>
          <div className="space-y-3 text-sm">
            {mockTests.map((item) => (
              <div
                key={`${item.subject}-${item.date}`}
                className="flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{item.subject}</p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-700 dark:text-neutral-200">
                    Grade: {item.grade}
                  </p>
                  <p className="text-primary-600 dark:text-primary-300 font-semibold">
                    +{item.bonus.toFixed(1)} pts
                  </p>
                </div>
              </div>
            ))}
            <p className="text-xs text-neutral-500">
              This is a preview. Connect your account to see live data.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
