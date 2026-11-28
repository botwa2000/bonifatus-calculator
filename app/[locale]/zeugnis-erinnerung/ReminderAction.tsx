'use client'

/**
 * The two pages a Zeugnis-Erinnerung mail links to (German only):
 * - confirm: the person presses the button (a link click alone does not confirm, so mail
 *   scanners that open links cannot sign anyone up);
 * - unsubscribe: runs on load, one click from the mail. Mail apps use the RFC 8058 header.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from '@/i18n/navigation'

type Phase = 'ready' | 'working' | 'confirmed' | 'already' | 'removed' | 'invalid' | 'error'

const box =
  'max-w-xl mx-auto rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8'
const h1 = 'text-2xl font-bold text-neutral-900 dark:text-white mb-3'
const p = 'text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4'
const linkClass = 'font-semibold text-primary-700 dark:text-primary-300 hover:underline'

export function ConfirmReminder({ id, token }: { id: string; token: string }) {
  const [phase, setPhase] = useState<Phase>(id && token ? 'ready' : 'invalid')
  const [landName, setLandName] = useState('')
  const [landSlug, setLandSlug] = useState('')

  async function go() {
    setPhase('working')
    try {
      const res = await fetch('/api/zeugnis-erinnerung/bestaetigen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, t: token }),
      })
      const body = await res.json().catch(() => ({}))
      if (body?.status === 'confirmed' || body?.status === 'already') {
        setLandName(body.landName)
        setLandSlug(body.land)
        setPhase(body.status)
      } else setPhase(res.status === 400 ? 'invalid' : 'error')
    } catch {
      setPhase('error')
    }
  }

  return (
    <div className={box}>
      {(phase === 'ready' || phase === 'working') && (
        <>
          <h1 className={h1}>Zeugnis-Erinnerung bestätigen</h1>
          <p className={p}>
            Ein Klick noch: Danach schreiben wir Ihnen eine Woche vor dem Halbjahreszeugnis und am
            Zeugnistag. Gespeichert werden nur Ihre E-Mail-Adresse und das Bundesland.
          </p>
          <button
            type="button"
            onClick={go}
            disabled={phase === 'working'}
            className="px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold disabled:opacity-50"
          >
            {phase === 'working' ? 'Wird bestätigt …' : 'Erinnerung bestätigen'}
          </button>
        </>
      )}
      {(phase === 'confirmed' || phase === 'already') && (
        <div role="status">
          <h1 className={h1}>{phase === 'confirmed' ? 'Bestätigt – danke!' : 'Schon bestätigt'}</h1>
          <p className={p}>
            Wir erinnern Sie an das Halbjahreszeugnis in {landName}. Jede E-Mail enthält einen Link,
            mit dem Sie sich mit einem Klick abmelden.
          </p>
          <p className={p}>
            Bis dahin:{' '}
            <Link href="/tools/zeugnisgeld-rechner" className={linkClass}>
              Zeugnisgeld ausrechnen →
            </Link>
          </p>
          {landSlug && (
            <Link href={`/ratgeber/halbjahreszeugnis-${landSlug}`} className={linkClass}>
              Halbjahreszeugnis {landName}: Termin & Ferien
            </Link>
          )}
        </div>
      )}
      {phase === 'invalid' && (
        <div role="alert">
          <h1 className={h1}>Dieser Link gilt nicht mehr</h1>
          <p className={p}>
            Bestätigungslinks gelten 72 Stunden. Melden Sie sich bitte noch einmal an – auf der
            Seite zum Halbjahreszeugnis Ihres Bundeslandes.
          </p>
          <Link
            href="/ratgeber/halbjahreszeugnis-bedeutung#zeugnis-erinnerung"
            className={linkClass}
          >
            Zur Anmeldung →
          </Link>
        </div>
      )}
      {phase === 'error' && (
        <div role="alert">
          <h1 className={h1}>Das hat nicht geklappt</h1>
          <p className={p}>Bitte versuchen Sie es in ein paar Minuten noch einmal.</p>
          <button type="button" onClick={go} className={linkClass}>
            Noch einmal versuchen
          </button>
        </div>
      )}
    </div>
  )
}

export function Unsubscribe({ id, token }: { id: string; token: string }) {
  const [phase, setPhase] = useState<Phase>(id && token ? 'working' : 'invalid')
  const ran = useRef(false)

  const go = async () => {
    setPhase('working')
    try {
      const res = await fetch('/api/zeugnis-erinnerung/abmelden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, t: token }),
      })
      setPhase(res.ok ? 'removed' : res.status === 400 ? 'invalid' : 'error')
    } catch {
      setPhase('error')
    }
  }

  useEffect(() => {
    if (ran.current || !id || !token) return
    ran.current = true
    go()
  }, [])

  return (
    <div className={box} role={phase === 'working' ? undefined : 'status'}>
      {phase === 'working' && <h1 className={h1}>Sie werden abgemeldet …</h1>}
      {phase === 'removed' && (
        <>
          <h1 className={h1}>Abgemeldet</h1>
          <p className={p}>
            Sie erhalten keine Zeugnis-Erinnerung mehr. Ihre E-Mail-Adresse ist gelöscht.
          </p>
          <Link href="/ratgeber" className={linkClass}>
            Zum Ratgeber →
          </Link>
        </>
      )}
      {phase === 'invalid' && (
        <>
          <h1 className={h1}>Dieser Abmeldelink ist ungültig</h1>
          <p className={p}>
            Bitte nutzen Sie den vollständigen Link aus der E-Mail. Oder schreiben Sie an{' '}
            <a href="mailto:privacy@bonifatus.com" className={linkClass}>
              privacy@bonifatus.com
            </a>
            , dann löschen wir Ihre Adresse.
          </p>
        </>
      )}
      {phase === 'error' && (
        <>
          <h1 className={h1}>Das hat nicht geklappt</h1>
          <p className={p}>Bitte versuchen Sie es noch einmal.</p>
          <button type="button" onClick={go} className={linkClass}>
            Noch einmal versuchen
          </button>
        </>
      )}
    </div>
  )
}
