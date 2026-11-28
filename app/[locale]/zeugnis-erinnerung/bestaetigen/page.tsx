import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { Footer } from '@/components/layout/Footer'
import { ConfirmReminder } from '../ReminderAction'

// Linked from the Zeugnis-Erinnerung mails only: German, never indexed.
export const metadata: Metadata = {
  title: 'Zeugnis-Erinnerung bestätigen',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}
const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '')

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params
  if (locale !== 'de') notFound()
  setRequestLocale(locale)
  const sp = await searchParams
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AppHeader variant="public" isAuthed={false} />
      <main className="px-4 py-16">
        <ConfirmReminder id={str(sp.id)} token={str(sp.t)} />
      </main>
      <Footer />
    </div>
  )
}
