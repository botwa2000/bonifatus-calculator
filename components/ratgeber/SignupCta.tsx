import { Link } from '@/i18n/navigation'

/**
 * The one call to action on a Ratgeber page or a German tool: sign up and keep the rule.
 * The button always goes to /register, so /admin/stats counts the step as
 * "register started" for the page the visit landed on. An optional plain link lets
 * readers try the rule in a calculator first, without an account.
 */
export function SignupCta({
  title,
  text,
  button,
  tool,
  as: Heading = 'p',
  className = '',
}: {
  title: string
  text: string
  button: string
  tool?: { href: string; label: string }
  /** The title element: h2 where the CTA is a section of the page, p inside an article section. */
  as?: 'h2' | 'p'
  className?: string
}) {
  return (
    <aside
      className={`rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-6 sm:p-8 text-white ${className}`}
    >
      <Heading className="text-xl font-bold mb-2">{title}</Heading>
      <p className="opacity-90 mb-6">{text}</p>
      <Link
        href="/register"
        className="inline-block px-8 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:shadow-xl transition-all"
      >
        {button}
      </Link>
      {tool && (
        <p className="mt-4 text-sm">
          <Link
            href={tool.href}
            className="underline underline-offset-2 opacity-90 hover:opacity-100"
          >
            {tool.label} →
          </Link>
        </p>
      )}
    </aside>
  )
}
