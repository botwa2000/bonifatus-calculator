import './globals.css'

// Only reached for requests outside the [locale] segment that no route or static file
// matches (e.g. /missing.php) — there is no locale to translate into, so this page is
// deliberately language-neutral. Locale paths use app/[locale]/not-found.tsx instead.
// The root layout renders no <html>, so this page must provide it.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-neutral-900">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          404
        </h1>
        <a
          href="/"
          className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
        >
          bonifatus.com
        </a>
      </body>
    </html>
  )
}
