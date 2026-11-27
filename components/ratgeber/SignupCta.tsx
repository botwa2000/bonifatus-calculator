import { Link } from '@/i18n/navigation'

/**
 * Sign up and keep the rule: the call to action on the Ratgeber hub and the German tools
 * ("save as your family's rule" on the Zeugnisgeld-Rechner). Articles lead to the
 * calculator first (CalculatorCta). The button always goes to /register, so /admin/stats
 * counts the step as "register started" for the page the visit landed on.
 */
export function SignupCta({
  title,
  text,
  button,
  as: Heading = 'p',
  className = '',
}: {
  title: string
  text: string
  button: string
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
    </aside>
  )
}
