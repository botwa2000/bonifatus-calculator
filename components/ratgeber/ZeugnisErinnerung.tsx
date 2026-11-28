'use client'

/**
 * "Erinnerung zum Zeugnistag + Zeugnisgeld-Tipps per E-Mail" (growth plan B8), German only
 * like the Ratgeber. On a Land page the Land is fixed; on the overview the reader picks it.
 * Double opt-in: the form only sends the confirmation mail (POST /api/zeugnis-erinnerung).
 * Turnstile loads on the first interaction with the form, not with the page.
 */
import { useEffect, useId, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Turnstile } from '@/components/ui/Turnstile'

export interface ReminderOption {
  slug: string
  name: string
  /** "Freitag, 22. Januar" */
  preDay: string
  /** "Freitag, 29. Januar" */
  dayDay: string
  kind: 'fixed' | 'window' | 'school'
  /** 'window' / 'school': "zum Halbjahresende" */
  note?: string
  /** ISO instant after which sign-ups for this Land are closed (the second mail is due). */
  closesAt: string
}

type State =
  { s: 'idle' } | { s: 'sending' } | { s: 'done'; email: string } | { s: 'error'; message: string }

const ERRORS: Record<string, string> = {
  email: 'Bitte prüfen Sie die E-Mail-Adresse.',
  land: 'Bitte wählen Sie ein Bundesland.',
  rate_limited:
    'Zu viele Anmeldungen von diesem Anschluss. Bitte versuchen Sie es in einer Stunde noch einmal.',
  bot: 'Die Sicherheitsprüfung ist abgelaufen. Bitte laden Sie die Seite neu und versuchen Sie es noch einmal.',
  closed:
    'Für dieses Bundesland ist der Zeugnistag schon da – eine Erinnerung lohnt sich nicht mehr.',
  mail: 'Die Bestätigungs-E-Mail konnte nicht verschickt werden. Bitte versuchen Sie es später noch einmal.',
}
const GENERIC = 'Das hat nicht geklappt. Bitte versuchen Sie es später noch einmal.'

function planText(o: ReminderOption) {
  const day =
    o.kind === 'fixed'
      ? `am Zeugnistag (${o.dayDay}) mit dem Link zur Bonifatus-App`
      : `am ${o.dayDay} ${o.note} mit dem Link zur Bonifatus-App (den Zeugnistag legt die Schule fest)`
  return `Wir schreiben Ihnen zweimal: am ${o.preDay} mit Tipps für den Zeugnistag und dem Zeugnisgeld-Rechner, und ${day}. Danach löschen wir Ihre Adresse.`
}

export function ZeugnisErinnerung({
  page,
  options,
  className = '',
}: {
  /** 'overview' or the Land slug of the page: counted per page in /admin/stats. */
  page: string
  /** One option on a Land page (fixed), all 16 on the overview. */
  options: ReminderOption[]
  className?: string
}) {
  const ids = useId()
  const fixed = options.length === 1 ? options[0] : null
  const [land, setLand] = useState(fixed?.slug ?? '')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>({ s: 'idle' })
  const [token, setToken] = useState('')
  const [verify, setVerify] = useState(false)
  // Bumped after a refused attempt: remounts Turnstile for a fresh single-use token.
  const [tsKey, setTsKey] = useState(0)
  // Which Länder are still open is decided in the browser (the page itself is static).
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => setNow(Date.now()), [])

  const open = options.filter((o) => now === null || now < Date.parse(o.closesAt))
  if (!open.length) return null
  const chosen = open.find((o) => o.slug === land) ?? null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!chosen) return setState({ s: 'error', message: ERRORS.land })
    setState({ s: 'sending' })
    try {
      const res = await fetch('/api/zeugnis-erinnerung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, land: chosen.slug, page, turnstileToken: token }),
      })
      if (res.ok) return setState({ s: 'done', email: email.trim() })
      const body = await res.json().catch(() => ({}))
      setState({ s: 'error', message: ERRORS[body?.error] ?? GENERIC })
      // A Turnstile token is single-use: get a fresh one for the next try.
      setToken('')
      setTsKey((k) => k + 1)
    } catch {
      setState({ s: 'error', message: GENERIC })
      setToken('')
      setTsKey((k) => k + 1)
    }
  }

  const input =
    'w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  return (
    <aside
      id="zeugnis-erinnerung"
      aria-labelledby={`${ids}-title`}
      className={`scroll-mt-24 rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-6 sm:p-8 ${className}`}
    >
      <h2 id={`${ids}-title`} className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
        Erinnerung zum Zeugnistag + Zeugnisgeld-Tipps per E-Mail
      </h2>

      {state.s === 'done' ? (
        <div role="status" className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p className="font-semibold text-neutral-900 dark:text-white mb-1">Fast geschafft.</p>
          <p>
            Wir haben eine E-Mail an <strong>{state.email}</strong> geschickt. Bitte bestätigen Sie
            die Anmeldung mit dem Link darin. Ohne Bestätigung schicken wir nichts.
          </p>
        </div>
      ) : (
        <>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-5">
            {chosen
              ? planText(chosen)
              : 'Wählen Sie Ihr Bundesland: Wir schreiben Ihnen eine Woche vor dem Halbjahreszeugnis mit Tipps und dem Zeugnisgeld-Rechner, und am Zeugnistag mit dem Link zur Bonifatus-App. Danach löschen wir Ihre Adresse.'}
          </p>
          <form
            onSubmit={submit}
            onFocusCapture={() => setVerify(true)}
            className="space-y-3"
            noValidate
          >
            <div className={`grid gap-3 ${fixed ? '' : 'sm:grid-cols-2'}`}>
              {!fixed && (
                <div>
                  <label htmlFor={`${ids}-land`} className="sr-only">
                    Bundesland
                  </label>
                  <select
                    id={`${ids}-land`}
                    value={land}
                    onChange={(e) => setLand(e.target.value)}
                    required
                    className={input}
                  >
                    <option value="">Bundesland wählen</option>
                    {open.map((o) => (
                      <option key={o.slug} value={o.slug}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor={`${ids}-email`} className="sr-only">
                  E-Mail-Adresse
                </label>
                <input
                  id={`${ids}-email`}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ihre E-Mail-Adresse"
                  className={input}
                />
              </div>
            </div>
            {verify && (
              <Turnstile
                key={tsKey}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                action="zeugnis-erinnerung"
                onSuccess={setToken}
                onError={() => setToken('')}
                onExpire={() => setToken('')}
                theme="auto"
                size="flexible"
              />
            )}
            <button
              type="submit"
              disabled={state.s === 'sending' || !token || !email || !chosen}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.s === 'sending' ? 'Wird gesendet …' : 'Erinnerung anfordern'}
            </button>
            {state.s === 'error' && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {state.message}
              </p>
            )}
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Wir speichern nur Ihre E-Mail-Adresse und das Bundesland. Sie bestätigen die Anmeldung
              per E-Mail und melden sich in jeder E-Mail mit einem Klick ab. Kein Newsletter, keine
              Weitergabe, keine Auswertung, ob Sie E-Mails öffnen.{' '}
              <Link
                href="/privacy#zeugnis-erinnerung"
                className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Datenschutz
              </Link>
            </p>
          </form>
        </>
      )}
    </aside>
  )
}
