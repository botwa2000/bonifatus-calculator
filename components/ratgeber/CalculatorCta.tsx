import { Link } from '@/i18n/navigation'
import { ZEUGNISGELD_PATH } from '@/content/tools/zeugnisgeld-rechner'

/**
 * The next step on a Ratgeber article (German only, like the articles): work out a rule
 * in the Zeugnisgeld-Rechner, no account needed. Saving it as the family's rule is the
 * calculator's own call to action, which goes to /register. /admin/stats follows the
 * path article → calculator → result → register started → account.
 */
export const CALCULATOR_CTA = {
  button: 'Zeugnisgeld ausrechnen',
  steps: [
    'Noten eingeben und eine Regel wählen – ohne Anmeldung.',
    'Passt die Regel, speichern Sie sie kostenlos als Regel Ihrer Familie.',
  ],
} as const

export function CalculatorCta({
  title,
  text,
  className = '',
}: {
  title: string
  text: string
  className?: string
}) {
  return (
    <aside
      className={`rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-6 sm:p-8 text-white ${className}`}
    >
      <p className="text-xl font-bold mb-2">{title}</p>
      <p className="opacity-90 mb-5">{text}</p>
      <ol className="mb-6 space-y-1.5 text-sm">
        {CALCULATOR_CTA.steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold"
            >
              {i + 1}
            </span>
            <span className="opacity-90 pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <Link
        href={ZEUGNISGELD_PATH}
        className="inline-block px-8 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:shadow-xl transition-all"
      >
        {CALCULATOR_CTA.button} →
      </Link>
    </aside>
  )
}
