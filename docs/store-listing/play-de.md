# Google Play listing, German (de-DE): draft for review

Status: **draft, 2026-11-23** (growth plan B7). Written by Claude Code; **Alex reviews and publishes**
in Play Console → Store presence → Main store listing → Deutsch (de-DE).
Nothing here has been sent to Play.

Search terms this listing targets (from the plan): _Belohnung für gute Noten_, _Zeugnis_ /
_Zeugnisgeld_, _Notenrechner_ / _Notendurchschnitt_. Each claim below was checked against the app
(see "Fact check" at the end). Character counts are Play's limits, counted with Python.

---

## App name (max. 30)

**Recommended:** `Bonifatus: Belohnung für Noten` (30/30)

Alternatives:

- `Bonifatus – Noten & Belohnung` (29): the current title, weaker on the search phrase
- `Bonifatus: Zeugnis & Belohnung` (30)

## Short description (max. 80)

**Recommended:** `Gute Noten belohnen: Noten per Foto erfassen, Schnitt rechnen, Punkte sammeln.` (78/80)

Alternative: `Belohnung für gute Noten und Zeugnisse – mit Notenrechner und Punkten` (69/80)

## Full description (max. 4000; this draft: 2,074)

```
Bonifatus macht aus guten Noten eine Belohnung, auf die sich die ganze Familie verlassen kann. Eltern legen einmal fest, was eine Note wert ist. Kinder tragen ihre Noten ein oder fotografieren sie, und Bonifatus rechnet die Punkte aus – nach der Regel der Familie, ohne Diskussion am Zeugnistag.

SO FUNKTIONIERT ES
1. Eltern legen die Regel fest: wie viele Punkte jede Note bringt, je nach Klassenstufe und ob es eine Klassenarbeit oder das Zeugnis ist.
2. Eltern laden ihr Kind per QR-Code oder Link ein.
3. Das Kind erfasst seine Noten – getippt oder per Foto. Die App erkennt die Noten, das Kind prüft und bestätigt sie.
4. Die Punkte sammeln sich. Wann und wie belohnt wird, entscheiden die Eltern: mit Geld, Taschengeld, einem Gutschein oder einer gemeinsamen Unternehmung.

FÜR ELTERN
• Belohnung für gute Noten als feste Regel statt Verhandlung
• Zeugnisgeld fair für alle Geschwister: eine Regel, gewichtet nach Klassenstufe
• Alle Kinder in einem Elternkonto, mit offenen und abgerechneten Punkten
• Abrechnen, wann es passt, und festhalten, wie belohnt wurde
• Noten-Verlauf über die Halbjahre: Fortschritte werden sichtbar, nicht nur Einsen

FÜR KINDER UND JUGENDLICHE
• Noten für alle Fächer erfassen, auch per Foto vom Zeugnis oder von der Klassenarbeit
• Notenrechner: Notendurchschnitt mit Fachgewichtung automatisch berechnet
• Vorher sehen, was eine Note bringt
• Punkte und Verlauf jederzeit im Blick

ZEUGNIS UND HALBJAHRESZEUGNIS
Ob Halbjahreszeugnis im Winter oder Jahreszeugnis im Sommer: Bonifatus hält jedes Zeugnis fest und zeigt, was sich seit dem letzten verändert hat. So wird das Zeugnisgespräch ein Gespräch über Fortschritte.

SICHER UND OHNE WERBUNG
• Anmeldung mit E-Mail, Google oder Apple
• Biometrische Anmeldung und automatische Abmeldung bei Inaktivität
• Noten auf dem Foto werden direkt auf dem Gerät erkannt
• Keine Werbung, keine In-App-Käufe
• In Deutsch, Englisch, Französisch, Italienisch, Spanisch und Russisch

Kostenlose Ratgeber für Eltern zu Zeugnisgeld, Notendurchschnitt und Belohnung ohne Geld: bonifatus.com/de/ratgeber
```

---

## Screenshot captions (German)

**Rendered 2026-11-27:** `screenshots-de/android_phone/01…08_*.png` (1080 × 1920, Google Play
phone), from German captures in `screenshots-de/raw/` (Pixel_8_Phone, app language Deutsch,
light mode, the store-review demo family Anna + Lena Becker on the dev database). Re-render with
`python docs/store-listing/make_screenshots_de.py`. Layout: header with badge, headline and
subline above the app screen; no caption is drawn over app content (the live English set does
that).

| #   | Screen (raw capture)                                     | Headline                                     | Subline                                                           |
| --- | -------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Parent home with pending points (`01_p01_home`)          | Gute Noten.<br>Faire Belohnung.              | Was Ihr Kind diese Woche verdient hat – auf einen Blick.          |
| 2   | Child's report card and tests (`02_p03_child_detail`)    | Jedes Zeugnis.<br>Jeder Punkt.               | Noten und Punkte pro Halbjahr, automatisch zusammengerechnet.     |
| 3   | Grade tier rule (`03_p_rule`)                            | Ihre Regel.<br>Einmal festgelegt.            | Wie viele Punkte jede Note bringt – Sie legen es fest.            |
| 4   | Settle, package expanded (`04_p05_settle`)               | Belohnen,<br>wann es passt.                  | Offene Punkte prüfen und mit einem Tipp abrechnen.                |
| 5   | Invite dialog with QR and code (`05_p_invite`)           | Kind einladen<br>in einer Minute.            | QR-Code scannen oder Link schicken – fertig.                      |
| 6   | Report card photo → 7 grades recognised (`06_s_capture`) | Zeugnis fotografieren.<br>Fertig.            | Die App erkennt die Noten, du bestätigst sie.                     |
| 7   | Grade calculator, 4 subjects (`07_s_calc`)               | Notenrechner.<br>Vorher wissen, was es gibt. | Punkte pro Fach ausrechnen, bevor das Zeugnis kommt.              |
| 8   | Student insights (`08_s_insights`)                       | Fortschritt<br>sichtbar machen.              | Punkte Monat für Monat und deine Notenverteilung auf einen Blick. |

Changed from the 11-23 draft so each caption only claims what its screen shows: #3 (the rule
screen has no class or report-card factors), #6 (the photo is a report card; "du" like 7–8),
#7 (the calculator shows points, no average), #8 (the history is monthly, not per half-year).

Fixed in the app for these shots (they showed English or wrong German before): subject names
in the app language everywhere, dates and decimals in the German format, "1 Note" (plural),
"1. / 2. Halbjahr", the German grade-tier names, and the insights card layout. They ship
with the next release; until it is live in production, Play users see the old texts.

--- | ------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| 1 | Parent home with pending points (`p01_home`) | Gute Noten.<br>Faire Belohnung. | Was Ihr Kind diese Woche verdient hat – auf einen Blick. |
| 2 | Child's grades and points (`p03_child_detail`) | Jedes Zeugnis.<br>Jeder Punkt. | Noten und Punkte pro Halbjahr, automatisch zusammengerechnet. |
| 3 | Bonus factors / rule (parent rewards screen, **new capture**) | Ihre Regel.<br>Einmal festgelegt. | Wie viele Punkte jede Note bringt – je nach Klasse und Zeugnis. |
| 4 | Settle (`p05_settle`) | Belohnen,<br>wann es passt. | Offene Punkte prüfen und mit einem Tipp abrechnen. |
| 5 | Invite dialog with QR (**new capture**, B6) | Kind einladen<br>in einer Minute. | QR-Code scannen oder Link schicken – fertig. |
| 6 | Grade capture, photo → recognised grades (**new capture**) | Note fotografieren.<br>Fertig. | Die App erkennt die Noten, dein Kind bestätigt sie. |
| 7 | Grade calculator (`s03_calculator`) | Notenrechner<br>mit Gewichtung. | Notendurchschnitt und Punkte, bevor das Zeugnis kommt. |
| 8 | Student insights (`s04_insights`) | Fortschritt<br>sichtbar machen. | Verlauf über die Halbjahre – nicht nur die Einsen zählen. |

Captions 1–5 address parents (Sie), 6–8 the child (du), matching the app.
German headlines run longer than English: check that each line fits the template at 1080 px
before publishing.

---

## App Store (iOS), with the next iOS build

Keywords field (max. 100, comma-separated, no spaces; this draft: 99):

```
Zeugnisgeld,Notenrechner,Notendurchschnitt,Zeugnis,Belohnung,Schule,Noten,Taschengeld,Eltern,Kinder
```

The App Store name and subtitle (30 each) can reuse the Play title and a cut short description:
subtitle `Gute Noten fair belohnen` (24).

---

## Fact check (claims → where in the app)

| Claim                                                     | Evidence                                                                                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Points per grade, by class level and test vs. report card | Bonus factors: grade tier, term type, class level (`/api/settings/factors`; parent rewards screen)                                                |
| Invite by QR or link                                      | B6 invite dialog (`invite_child_dialog.dart`), `/invite?code=` page                                                                               |
| Grades from a photo, child confirms                       | `capture_screen.dart`, google_mlkit_text_recognition (on-device); strings `captureNGradesDetected`, `captureDetectedHint`                         |
| Settle when ready; record how (cash, voucher, savings …)  | Settle screen; payout methods `payoutCash`, `payoutBank`, `payoutVoucher`, `payoutSavings`, `payoutInvest` (records only, the app moves no money) |
| Weighted average                                          | `weightTooltip` (Fachgewichtung) and `subjectsAvg`                                                                                                |
| History across terms                                      | Insights / `GradeTrendChart`                                                                                                                      |
| Biometric + inactivity logout                             | `biometric_enabled`, `InactivityGuard` (CLAUDE.md)                                                                                                |
| Google / Apple / e-mail sign-in                           | `loginWithGoogle`, `loginWithApple`, e-mail sign-up                                                                                               |
| No ads, no in-app purchases                               | No ad SDK or IAP package in `pubspec.yaml`; `/api/payments` is payout tracking                                                                    |
| Six languages                                             | Six ARB files                                                                                                                                     |

Not claimed on purpose: where the data is hosted (not verified for this draft), any user numbers,
any "#1" or ranking wording (Play policy).
