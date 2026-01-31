export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center dark:border-neutral-600 dark:bg-neutral-800/50">
        <span className="mb-2 inline-block rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold uppercase text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
          Coming Soon
        </span>
        <h2 className="mt-2 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
          Admin Settings
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          System configuration, grading system defaults, email templates, and subscription tier
          management will be available here.
        </p>
      </div>
    </div>
  )
}
