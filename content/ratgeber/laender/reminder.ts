// Zeugnis-Erinnerung (growth plan B8): when the two e-mails go out, per Land.
//
// The dates restate the Land pages (./drafts.ts, `facts.zeugnis`), which cite the official
// sources; laender.test.ts checks that each date here appears on its page. Where no Land-wide
// day exists, the mails do not pretend one does:
// - 'fixed'  — the Land sets the day; the second mail goes out that morning.
// - 'window' — the Land sets a range and the school picks the day (Baden-Württemberg);
//              the second mail goes out on the first day of the range.
// - 'school' — no Land-wide day (Hamburg, Mecklenburg-Vorpommern); the second mail goes out
//              on the last school day before the fixed break the pages name, and says that
//              the school sets the day.
// The first mail goes out seven days before the second, both at 07:00 German time.

export const REMINDER_SEASON = '2027-halbjahr'
/** Hour (Europe/Berlin) at which a day's mails go out. */
export const REMINDER_SEND_HOUR = 7
export const REMINDER_LEAD_DAYS = 7

export type ReminderKind = 'fixed' | 'window' | 'school'

export interface LandReminder {
  slug: string
  /** Date of the second mail (YYYY-MM-DD, German calendar day). */
  day: string
  kind: ReminderKind
  /** How the day reads in a sentence: "am Freitag, 29. Januar 2027". */
  when: string
  /** The Land's rule gives the day "in der Regel" (Hessen): the mail says so. */
  usually?: true
  /** 'window' / 'school': when the second mail comes, for the form ("zum Halbjahresende"). */
  note?: string
}

const fixed = (slug: string, day: string, when: string): LandReminder => ({
  slug,
  day,
  kind: 'fixed',
  when,
})
const JAN29 = 'am Freitag, 29. Januar 2027'

export const LAND_REMINDERS: readonly LandReminder[] = [
  {
    slug: 'baden-wuerttemberg',
    day: '2027-02-01',
    kind: 'window',
    when: 'zwischen dem 1. und 10. Februar 2027 – den Tag legt die Schule fest',
    note: 'zu Beginn des Zeitraums 1. bis 10. Februar',
  },
  fixed('bayern', '2027-02-19', 'am Freitag, 19. Februar 2027'),
  fixed('berlin', '2027-01-29', JAN29),
  fixed('brandenburg', '2027-01-29', JAN29),
  fixed('bremen', '2027-01-29', JAN29),
  {
    slug: 'hamburg',
    day: '2027-01-28',
    kind: 'school',
    when: 'zum Halbjahresende vor der Halbjahrespause am Freitag, 29. Januar 2027 – den Tag legt die Schule fest',
    note: 'zum Halbjahresende',
  },
  { ...fixed('hessen', '2027-01-29', 'in der Regel am Freitag, 29. Januar 2027'), usually: true },
  {
    slug: 'mecklenburg-vorpommern',
    day: '2027-02-05',
    kind: 'school',
    when: 'vor den Winterferien ab Montag, 8. Februar 2027 – den Tag legt die Schule fest',
    note: 'vor den Winterferien',
  },
  fixed('niedersachsen', '2027-01-29', JAN29),
  fixed('nordrhein-westfalen', '2027-02-12', 'am Freitag, 12. Februar 2027'),
  fixed('rheinland-pfalz', '2027-01-29', JAN29),
  fixed('saarland', '2027-01-29', JAN29),
  fixed('sachsen', '2027-02-05', 'am Freitag, 5. Februar 2027'),
  fixed('sachsen-anhalt', '2027-01-29', JAN29),
  fixed('schleswig-holstein', '2027-01-29', JAN29),
  fixed('thueringen', '2027-01-29', JAN29),
]

export function getLandReminder(slug: string): LandReminder | undefined {
  return LAND_REMINDERS.find((r) => r.slug === slug)
}

/** The UTC instant of `hour`:00 German time on a German calendar day (CET or CEST). */
export function berlinInstant(day: string, hour: number): Date {
  const [y, m, d] = day.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d, hour)
  // Offset of Europe/Berlin at that moment, from the formatted wall-clock time.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
  }).formatToParts(new Date(guess))
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value)
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'))
  return new Date(guess - (wall - guess))
}

export interface ReminderSchedule {
  /** First mail: tips + Zeugnisgeld-Rechner, a week before. */
  pre: Date
  /** Second mail: on the day, with the app link. */
  day: Date
}

export function reminderSchedule(r: LandReminder): ReminderSchedule {
  const [y, m, d] = r.day.split('-').map(Number)
  const preDay = new Date(Date.UTC(y, m - 1, d - REMINDER_LEAD_DAYS)).toISOString().slice(0, 10)
  return {
    pre: berlinInstant(preDay, REMINDER_SEND_HOUR),
    day: berlinInstant(r.day, REMINDER_SEND_HOUR),
  }
}

/** Sign-ups close when the second mail is due: after that there is nothing left to remind of. */
export function reminderOpen(r: LandReminder, now: Date = new Date()): boolean {
  return now < reminderSchedule(r).day
}

/** "Freitag, 22. Januar" — for the form ("Wir schreiben Ihnen am …"). */
export function germanDay(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}
