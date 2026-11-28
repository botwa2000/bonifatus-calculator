import { describe, expect, it, beforeAll } from 'vitest'
import { LAND_PAGES } from '@/content/ratgeber/laender'
import {
  LAND_REMINDERS,
  berlinInstant,
  getLandReminder,
  reminderOpen,
  reminderSchedule,
} from '@/content/ratgeber/laender/reminder'
import { reminderOptions } from '@/components/ratgeber/ZeugnisErinnerungBlock'
import { shapeReminderRows } from '@/lib/stats/funnel'
import { confirmMail, dayMail, preMail } from './emails'
import { isSourcePage, isUuid, normalizeEmail, linkToken, validLinkToken } from './zeugnis'

const MONTHS = ['Januar', 'Februar', 'März']
/** "2027-01-29" → "29. Januar" as the Land pages write it. */
const asGerman = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number)
  return `${d}. ${MONTHS[m - 1]}`
}

describe('Zeugnis-Erinnerung schedule', () => {
  it('covers each of the 16 Land pages once', () => {
    expect(LAND_REMINDERS.map((r) => r.slug).sort()).toEqual(LAND_PAGES.map((p) => p.slug).sort())
  })

  it('sends on the date each Land page names', () => {
    for (const r of LAND_REMINDERS) {
      const page = LAND_PAGES.find((p) => p.slug === r.slug)!
      if (r.kind === 'fixed') {
        expect(page.facts.zeugnis, r.slug).toContain(asGerman(r.day))
        expect(r.when, r.slug).toContain(asGerman(r.day))
      }
    }
    // No Land-wide day: anchored to the dates the pages do name, and the mail says so.
    expect(getLandReminder('baden-wuerttemberg')!.day).toBe('2027-02-01') // "1. bis 10. Februar"
    expect(LAND_PAGES.find((p) => p.slug === 'baden-wuerttemberg')!.facts.zeugnis).toContain(
      '1. bis 10. Februar 2027'
    )
    expect(getLandReminder('hamburg')!.day).toBe('2027-01-28') // day before the Halbjahrespause
    expect(LAND_PAGES.find((p) => p.slug === 'hamburg')!.facts.zeugnis).toContain('29. Januar 2027')
    expect(getLandReminder('mecklenburg-vorpommern')!.day).toBe('2027-02-05') // Fri before Ferien
    expect(LAND_PAGES.find((p) => p.slug === 'mecklenburg-vorpommern')!.facts.ferien).toContain(
      '8. – 19. Februar 2027'
    )
    for (const r of LAND_REMINDERS.filter((x) => x.kind !== 'fixed')) {
      expect(r.when).toContain('den Tag legt die Schule fest')
      expect(r.note).toBeTruthy()
    }
  })

  it('every send day is a school day (Mon–Fri)', () => {
    for (const r of LAND_REMINDERS) {
      const s = reminderSchedule(r)
      for (const d of [s.pre, s.day]) {
        const wd = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Berlin',
          weekday: 'short',
        }).format(d)
        expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], `${r.slug} ${d.toISOString()}`).toContain(wd)
      }
    }
  })

  it('computes 07:00 German time in winter and summer', () => {
    expect(berlinInstant('2027-01-29', 7).toISOString()).toBe('2027-01-29T06:00:00.000Z')
    expect(berlinInstant('2027-06-01', 7).toISOString()).toBe('2027-06-01T05:00:00.000Z')
  })

  it('sends the first mail a week before, and closes sign-ups when the second is due', () => {
    const berlin = getLandReminder('berlin')!
    const s = reminderSchedule(berlin)
    expect(s.pre.toISOString()).toBe('2027-01-22T06:00:00.000Z')
    expect(s.day.toISOString()).toBe('2027-01-29T06:00:00.000Z')
    expect(reminderOpen(berlin, new Date('2027-01-29T05:59:59Z'))).toBe(true)
    expect(reminderOpen(berlin, new Date('2027-01-29T06:00:00Z'))).toBe(false)
  })

  it('gives the form German dates', () => {
    const [berlin] = reminderOptions('berlin')
    expect(berlin).toMatchObject({
      name: 'Berlin',
      preDay: 'Freitag, 22. Januar',
      dayDay: 'Freitag, 29. Januar',
      kind: 'fixed',
      closesAt: '2027-01-29T06:00:00.000Z',
    })
    expect(reminderOptions()).toHaveLength(16)
  })
})

describe('Zeugnis-Erinnerung input', () => {
  it('normalises addresses and rejects non-addresses', () => {
    expect(normalizeEmail('  Anna.Becker@Example.DE ')).toBe('anna.becker@example.de')
    expect(normalizeEmail('anna@example')).toBeNull()
    expect(normalizeEmail('no at sign')).toBeNull()
    expect(normalizeEmail(`${'a'.repeat(250)}@x.de`)).toBeNull()
    expect(normalizeEmail(42)).toBeNull()
  })

  it('accepts only known source pages', () => {
    expect(isSourcePage('overview')).toBe(true)
    expect(isSourcePage('berlin')).toBe(true)
    expect(isSourcePage('/de/ratgeber/x')).toBe(false)
    expect(isSourcePage(undefined)).toBe(false)
  })
})

describe('Zeugnis-Erinnerung link tokens', () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = 'test-secret'
  })
  const id = '5b0f3c2e-8f6a-4c1d-9e2b-7a1c3d4e5f60'

  it('verifies only the token made for that id', () => {
    const t = linkToken('unsub', id)
    expect(validLinkToken('unsub', id, t)).toBe(true)
    expect(validLinkToken('unsub', id, t.slice(0, -1) + (t.endsWith('A') ? 'B' : 'A'))).toBe(false)
    expect(validLinkToken('unsub', '5b0f3c2e-8f6a-4c1d-9e2b-7a1c3d4e5f61', t)).toBe(false)
    // An unsubscribe link cannot confirm, and the other way round.
    expect(validLinkToken('confirm', id, t)).toBe(false)
    expect(validLinkToken('unsub', id, linkToken('confirm', id))).toBe(false)
    expect(validLinkToken('unsub', id, '')).toBe(false)
    expect(validLinkToken('unsub', id, null)).toBe(false)
    expect(isUuid(id)).toBe(true)
    expect(isUuid("1' OR 1=1")).toBe(false)
  })
})

describe('Zeugnis-Erinnerung mails', () => {
  const urls = {
    unsubscribeUrl: 'https://bonifatus.com/de/zeugnis-erinnerung/abmelden?id=x&t=y',
    unsubscribeApiUrl: 'https://bonifatus.com/api/zeugnis-erinnerung/abmelden?id=x&t=y',
  }
  const mails = [
    preMail({ landName: 'Berlin', when: 'am Freitag, 29. Januar 2027', ...urls }),
    dayMail({ landName: 'Berlin', when: 'am Freitag, 29. Januar 2027', kind: 'fixed', ...urls }),
  ]

  it('carry no tracking: no images, only campaign parameters on links', () => {
    for (const m of [
      ...mails,
      confirmMail({
        landName: 'Berlin',
        confirmUrl: 'https://bonifatus.com/de/zeugnis-erinnerung/bestaetigen?t=abc',
        preDay: 'Freitag, 22. Januar',
        when: 'x',
      }),
    ]) {
      expect(m.html).not.toMatch(/<img|background-image|url\(/i)
      const hrefs = [...m.html.matchAll(/href="([^"]+)"/g)].map((x) => x[1].replace(/&amp;/g, '&'))
      for (const h of hrefs) {
        const u = new URL(h)
        const extra = [...u.searchParams.keys()].filter(
          (k) => !['utm_source', 'utm_medium', 'utm_campaign', 'id', 't'].includes(k)
        )
        expect(extra, h).toEqual([])
        expect(['bonifatus.com', 'play.google.com', 'apps.apple.com']).toContain(u.hostname)
      }
    }
  })

  it('every reminder has a one-click unsubscribe (link and RFC 8058 headers)', () => {
    for (const m of mails) {
      expect(m.html).toContain(urls.unsubscribeUrl.replace(/&/g, '&amp;'))
      expect(m.text).toContain(urls.unsubscribeUrl)
      expect(m.headers).toEqual({
        'List-Unsubscribe': `<${urls.unsubscribeApiUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      })
    }
  })

  it('the week-before mail links the calculator; the day mail the app', () => {
    expect(mails[0].html).toContain('/de/tools/zeugnisgeld-rechner?utm_source=zeugnis-erinnerung')
    expect(mails[1].html).toContain('play.google.com/store/apps/details?id=com.bonifatus.app')
    expect(mails[1].html).toContain('apps.apple.com/app/id6745130824')
    expect(mails[1].subject).toBe('Heute gibt es Halbjahreszeugnisse in Berlin')
  })

  it('does not claim a fixed day where there is none', () => {
    const hh = getLandReminder('hamburg')!
    const m = dayMail({ landName: 'Hamburg', when: hh.when, kind: hh.kind, ...urls })
    expect(m.subject).toBe('Zeugniszeit in Hamburg')
    expect(m.text).not.toContain('heute ist Zeugnistag')
    const he = getLandReminder('hessen')!
    expect(
      dayMail({ landName: 'Hessen', when: he.when, kind: he.kind, usually: he.usually, ...urls })
        .text
    ).toContain('heute ist in der Regel Zeugnistag in Hessen')
  })

  it('escapes HTML in names', () => {
    const m = preMail({ landName: '<b>X</b>', when: 'y', ...urls })
    expect(m.html).not.toContain('<b>X</b>')
  })
})

describe('Zeugnis-Erinnerung stats', () => {
  it('puts a total first and labels pages by path', () => {
    const rows = shapeReminderRows([
      { page: 'berlin', visits: 10, requested: 2, confirmed: 1, unsubscribed: 0 },
      { page: 'overview', visits: 30, requested: 3, confirmed: 2, unsubscribed: 1 },
    ])
    expect(rows[0]).toEqual({
      page: 'all pages',
      visits: 40,
      requested: 5,
      confirmed: 3,
      unsubscribed: 1,
    })
    expect(rows[1].page).toBe('/de/ratgeber/halbjahreszeugnis-bedeutung')
    expect(rows[2].page).toBe('/de/ratgeber/halbjahreszeugnis-berlin')
  })
})
