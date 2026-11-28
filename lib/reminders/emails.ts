/**
 * Zeugnis-Erinnerung mails (growth plan B8), German like the Ratgeber.
 *
 * No tracking of any kind: no remote images (so no open pixel), no redirect or
 * per-recipient links. Links carry only the campaign (utm_source/medium/campaign), which
 * the site's own first-party statistics read like any other visit's; nothing in them
 * identifies the recipient. Every mail after the opt-in has an unsubscribe link, and the
 * List-Unsubscribe headers (RFC 8058) give mail apps a one-click button.
 */
import { SITE_URL } from '@/lib/site'
import { ZEUGNISGELD_PATH } from '@/content/tools/zeugnisgeld-rechner'

export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.bonifatus.app'
export const APP_STORE_URL = 'https://apps.apple.com/app/id6745130824'

export interface Mail {
  subject: string
  text: string
  html: string
  headers?: Record<string, string>
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Absolute site link with the mail's campaign; `/x` → https://bonifatus.com/de/x. */
export function siteLink(path: string, campaign?: string): string {
  const url = new URL(`/de${path === '/' ? '' : path}`, SITE_URL)
  if (campaign) {
    url.searchParams.set('utm_source', 'zeugnis-erinnerung')
    url.searchParams.set('utm_medium', 'email')
    url.searchParams.set('utm_campaign', campaign)
  }
  return url.toString()
}

const P = 'margin:0 0 16px;color:#334155;font-size:16px;line-height:1.6;'
const SMALL = 'margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.5;'

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${esc(href)}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;border-radius:8px;font-weight:600;text-decoration:none;font-size:16px;">${esc(label)}</a></p>`
}

function link(href: string, label: string): string {
  return `<a href="${esc(href)}" style="color:#4f46e5;">${esc(label)}</a>`
}

/** Minimal, image-free layout: renders the same with remote content blocked. */
function layout(subject: string, body: string, footer: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td style="padding:32px 12px;">
<table role="presentation" style="max-width:560px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;border-collapse:collapse;">
<tr><td style="padding:24px 32px 8px;"><p style="margin:0;color:#4f46e5;font-size:18px;font-weight:700;">Bonifatus</p></td></tr>
<tr><td style="padding:16px 32px 8px;">${body}</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid #e2e8f0;">${footer}</td></tr>
</table></td></tr></table>
</body></html>`
}

const privacyLine = (campaign?: string) =>
  `Datenschutz: ${siteLink('/privacy#zeugnis-erinnerung', campaign)}`

/** The opt-in mail. Nothing else is sent until the link in it is used. */
export function confirmMail(o: {
  landName: string
  confirmUrl: string
  preDay: string
  when: string
}): Mail {
  const subject = `Bitte bestätigen: Zeugnis-Erinnerung für ${o.landName}`
  const text = `Guten Tag,

Sie möchten an das Halbjahreszeugnis in ${o.landName} erinnert werden. Bitte bestätigen Sie das mit diesem Link:

${o.confirmUrl}

Danach schreiben wir Ihnen zweimal: am ${o.preDay} mit Tipps für den Zeugnistag und dem Zeugnisgeld-Rechner, und wenn die Zeugnisse kommen (${o.when}) mit dem Link zur Bonifatus-App. Danach löschen wir Ihre Adresse.

Sie haben sich nicht angemeldet? Dann ignorieren Sie diese E-Mail. Ohne Bestätigung schicken wir nichts und löschen die Adresse nach 72 Stunden.

Bonifatus · ${SITE_URL.replace(/^https?:\/\//, '')}
${privacyLine()}`

  const html = layout(
    subject,
    `<p style="${P}">Guten Tag,</p>
<p style="${P}">Sie möchten an das Halbjahreszeugnis in <strong>${esc(o.landName)}</strong> erinnert werden. Bitte bestätigen Sie das:</p>
${button(o.confirmUrl, 'Erinnerung bestätigen')}
<p style="${P}">Danach schreiben wir Ihnen zweimal: am <strong>${esc(o.preDay)}</strong> mit Tipps für den Zeugnistag und dem Zeugnisgeld-Rechner, und wenn die Zeugnisse kommen (${esc(o.when)}) mit dem Link zur Bonifatus-App. Danach löschen wir Ihre Adresse.</p>
<p style="${SMALL}">Funktioniert der Knopf nicht? Diesen Link im Browser öffnen:<br><span style="word-break:break-all;">${esc(o.confirmUrl)}</span></p>`,
    `<p style="${SMALL}">Sie haben sich nicht angemeldet? Dann ignorieren Sie diese E-Mail. Ohne Bestätigung schicken wir nichts und löschen die Adresse nach 72 Stunden.</p>
<p style="${SMALL}">Bonifatus · ${link(siteLink('/privacy#zeugnis-erinnerung'), 'Datenschutz')}</p>`
  )
  return { subject, text, html }
}

function unsubscribeHeaders(unsubscribeApiUrl: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubscribeApiUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

function reminderFooter(o: { landName: string; unsubscribeUrl: string; last: boolean }) {
  const why = `Sie erhalten diese E-Mail, weil Sie auf bonifatus.com die Zeugnis-Erinnerung für ${o.landName} bestätigt haben.`
  const next = o.last
    ? 'Das war die letzte Erinnerung; Ihre Adresse wird jetzt gelöscht.'
    : 'Am Zeugnistag folgt eine letzte E-Mail, danach löschen wir Ihre Adresse.'
  return {
    text: `${why} ${next}
Abmelden mit einem Klick: ${o.unsubscribeUrl}
Bonifatus · ${privacyLine()}`,
    html: `<p style="${SMALL}">${esc(why)} ${esc(next)}</p>
<p style="${SMALL}">${link(o.unsubscribeUrl, 'Abmelden mit einem Klick')} · ${link(siteLink('/privacy#zeugnis-erinnerung'), 'Datenschutz')}</p>`,
  }
}

/** One week before: tips for the day and the Zeugnisgeld-Rechner. */
export function preMail(o: {
  landName: string
  when: string
  unsubscribeUrl: string
  unsubscribeApiUrl: string
}): Mail {
  const c = 'vorher'
  const calc = siteLink(ZEUGNISGELD_PATH, c)
  const talk = siteLink('/ratgeber/zeugnis-gespraech-fuehren', c)
  const bad = siteLink('/ratgeber/schlechtes-zeugnis-was-tun', c)
  const subject = `In einer Woche: Halbjahreszeugnis in ${o.landName}`
  const tips = [
    {
      t: 'Zuerst zuhören.',
      d: 'Lassen Sie Ihr Kind das Zeugnis zeigen und fragen Sie, worauf es stolz ist. Was zuerst gesagt wird, prägt das Gespräch mehr als jede einzelne Note.',
    },
    {
      t: 'Einordnen statt urteilen.',
      d: 'Das Halbjahreszeugnis ist ein Zwischenstand. Ein halbes Schuljahr bleibt, um an schwachen Fächern zu arbeiten.',
    },
    {
      t: 'Zeugnisgeld vorher festlegen.',
      d: 'Wer die Regel vor dem Zeugnistag vereinbart, muss am Tag selbst nicht verhandeln – und alle Geschwister wissen, woran sie sind.',
    },
  ]
  const fm = reminderFooter({ landName: o.landName, unsubscribeUrl: o.unsubscribeUrl, last: false })
  const text = `Guten Tag,

in ${o.landName} gibt es die Halbjahreszeugnisse ${o.when}. Drei Tipps für den Tag:

${tips.map((x, i) => `${i + 1}. ${x.t} ${x.d}`).join('\n\n')}

Welche Regel passt zu Ihrer Familie? Der Zeugnisgeld-Rechner rechnet es mit echten Noten durch – pro Note, pro Verbesserung oder pauschal, ohne Anmeldung:
${calc}

Leitfaden für das Gespräch: ${talk}
Wenn das Zeugnis schlecht ausfällt: ${bad}

Maßgeblich ist der Termin, den die Schule nennt.

${fm.text}`
  const html = layout(
    subject,
    `<p style="${P}">Guten Tag,</p>
<p style="${P}">in <strong>${esc(o.landName)}</strong> gibt es die Halbjahreszeugnisse ${esc(o.when)}. Drei Tipps für den Tag:</p>
<ol style="margin:0 0 16px;padding-left:22px;color:#334155;font-size:16px;line-height:1.6;">
${tips.map((x) => `<li style="margin-bottom:10px;"><strong>${esc(x.t)}</strong> ${esc(x.d)}</li>`).join('\n')}
</ol>
<p style="${P}">Welche Regel passt zu Ihrer Familie? Der Zeugnisgeld-Rechner rechnet es mit echten Noten durch – pro Note, pro Verbesserung oder pauschal, ohne Anmeldung.</p>
${button(calc, 'Zeugnisgeld ausrechnen')}
<p style="${P}">Zum Weiterlesen: ${link(talk, 'Leitfaden für das Zeugnisgespräch')} · ${link(bad, 'Wenn das Zeugnis schlecht ausfällt')}</p>
<p style="${SMALL}">Maßgeblich ist der Termin, den die Schule nennt.</p>`,
    fm.html
  )
  return { subject, text, html, headers: unsubscribeHeaders(o.unsubscribeApiUrl) }
}

/** On the day: the app link. */
export function dayMail(o: {
  landName: string
  when: string
  kind: 'fixed' | 'window' | 'school'
  usually?: boolean
  unsubscribeUrl: string
  unsubscribeApiUrl: string
}): Mail {
  const c = 'zeugnistag'
  const register = siteLink('/register', c)
  const subject =
    o.kind === 'fixed'
      ? `Heute gibt es Halbjahreszeugnisse in ${o.landName}`
      : `Zeugniszeit in ${o.landName}`
  const opening =
    o.kind === 'fixed'
      ? `heute ist ${o.usually ? 'in der Regel ' : ''}Zeugnistag in ${o.landName}.`
      : `in ${o.landName} kommen die Halbjahreszeugnisse ${o.when}.`
  const fm = reminderFooter({ landName: o.landName, unsubscribeUrl: o.unsubscribeUrl, last: true })
  const app =
    'Damit die Belohnung beim nächsten Zeugnis keine Verhandlung wird: In der Bonifatus-App legen Sie einmal fest, was eine Note wert ist. Ihr Kind trägt die Noten ein oder fotografiert das Zeugnis, und die App rechnet die Punkte aus. Kostenlos, ohne Werbung.'
  const text = `Guten Morgen,

${opening} Ein guter erster Satz, bevor es um Noten geht: „Zeig mal – worüber freust du dich?“

${app}

Android (Google Play): ${PLAY_URL}
iPhone (App Store): ${APP_STORE_URL}
Im Browser: ${register}

Maßgeblich ist der Termin, den die Schule nennt.

${fm.text}`
  const html = layout(
    subject,
    `<p style="${P}">Guten Morgen,</p>
<p style="${P}">${esc(opening)} Ein guter erster Satz, bevor es um Noten geht: „Zeig mal – worüber freust du dich?“</p>
<p style="${P}">${esc(app)}</p>
${button(PLAY_URL, 'Bonifatus bei Google Play')}
<p style="${P}">${link(APP_STORE_URL, 'Bonifatus im App Store (iPhone)')} · ${link(register, 'im Browser registrieren')}</p>
<p style="${SMALL}">Maßgeblich ist der Termin, den die Schule nennt.</p>`,
    fm.html
  )
  return { subject, text, html, headers: unsubscribeHeaders(o.unsubscribeApiUrl) }
}
