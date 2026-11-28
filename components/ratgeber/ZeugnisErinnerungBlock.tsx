import { LAND_PAGES } from '@/content/ratgeber/laender'
import { LAND_REMINDERS, germanDay, reminderSchedule } from '@/content/ratgeber/laender/reminder'
import { ZeugnisErinnerung, type ReminderOption } from './ZeugnisErinnerung'

/** The form's options, computed on the server (dates in German time). */
export function reminderOptions(land?: string): ReminderOption[] {
  return LAND_REMINDERS.filter((r) => !land || r.slug === land).map((r) => {
    const s = reminderSchedule(r)
    return {
      slug: r.slug,
      name: LAND_PAGES.find((p) => p.slug === r.slug)?.name ?? r.slug,
      preDay: germanDay(s.pre),
      dayDay: germanDay(s.day),
      kind: r.kind,
      note: r.note,
      closesAt: s.day.toISOString(),
    }
  })
}

/** Zeugnis-Erinnerung sign-up: one Land on its page, all 16 on the overview. */
export function ZeugnisErinnerungBlock({ land, className }: { land?: string; className?: string }) {
  return (
    <ZeugnisErinnerung
      page={land ?? 'overview'}
      options={reminderOptions(land)}
      className={className}
    />
  )
}
