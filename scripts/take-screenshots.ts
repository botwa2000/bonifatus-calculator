import { test, expect, type Page } from '@playwright/test'
import path from 'path'

const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'images', 'screenshots')

const STUDENT_EMAIL = process.env.SCREENSHOT_STUDENT_EMAIL || 'max@example.com'
const STUDENT_PASSWORD = process.env.SCREENSHOT_STUDENT_PASSWORD || 'Test1234!@#$'
const PARENT_EMAIL = process.env.SCREENSHOT_PARENT_EMAIL || 'anna@example.com'
const PARENT_PASSWORD = process.env.SCREENSHOT_PARENT_PASSWORD || 'Test1234!@#$'

// Replace real emails/names with fictive ones in the DOM before screenshots
const REDACTIONS: [RegExp, string][] = [
  [/alexander\.perel@gmail\.com/gi, 'max.mueller@example.com'],
  [/alexanderperel@yahoo\.com/gi, 'anna.schmidt@example.com'],
  [/bonifatus\.app@gmail\.com/gi, 'admin@example.com'],
  [/botwa2002@mail\.ru/gi, 'ben@example.com'],
]

async function scrubPage(page: Page) {
  await page.evaluate(
    (redactions) => {
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
          let text = node.textContent
          for (const [pattern, replacement] of redactions) {
            text = text.replace(new RegExp(pattern, 'gi'), replacement)
          }
          node.textContent = text
        } else {
          node.childNodes.forEach(walk)
        }
      }
      walk(document.body)
    },
    REDACTIONS.map(([re, rep]) => [re.source, rep])
  )
}

async function dismissCookieBanner(page: Page) {
  const acceptBtn = page.getByText('Alle akzeptieren')
  if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptBtn.click()
    await page.waitForTimeout(500)
  }
}

async function login(page: Page, email: string, password: string) {
  // 1. Get CSRF token
  await page.goto('/api/auth/csrf')
  const { csrfToken } = JSON.parse(await page.locator('body').innerText())

  // 2. POST to the credentials callback using URLSearchParams to ensure
  //    proper encoding of special characters in passwords.
  const body = new URLSearchParams()
  body.set('email', email)
  body.set('password', password)
  body.set('csrfToken', csrfToken)
  body.set('turnstileToken', '')
  body.set('json', 'true')

  await page.request
    .post('/api/auth/callback/credentials', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: body.toString(),
      maxRedirects: 0,
    })
    .catch(() => {}) // 302 is expected

  // 3. Verify
  await page.goto('/api/auth/session')
  const session = JSON.parse(await page.locator('body').innerText())
  if (!session?.user?.email) {
    throw new Error(`Login failed for ${email}. Session: ${JSON.stringify(session)}`)
  }

  // 4. Dismiss cookie banner
  await page.goto('/de')
  await dismissCookieBanner(page)
}

function screenshotPath(name: string, project: string) {
  return path.join(SCREENSHOT_DIR, `${name}-${project}.png`)
}

function projectName(testInfo: { project: { name: string } }) {
  return testInfo.project.name // 'mobile' or 'desktop'
}

// ---------- Landing page (no auth) ----------

test('landing', async ({ page }, testInfo) => {
  await page.goto('/de')
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle')
  await dismissCookieBanner(page)
  // Give animations time to settle
  await page.waitForTimeout(1500)
  await scrubPage(page)
  await page.screenshot({
    path: screenshotPath('landing', projectName(testInfo)),
    fullPage: false,
  })
})

// ---------- Student pages ----------

test.describe('student', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD)
  })

  test('student-dashboard', async ({ page }, testInfo) => {
    await page.goto('/de/student/dashboard')
    await page.waitForLoadState('networkidle')
    // Wait for charts/data to render
    await page.waitForTimeout(2000)
    await scrubPage(page)
    await page.screenshot({
      path: screenshotPath('student-dashboard', projectName(testInfo)),
      fullPage: false,
    })
  })

  test('student-saved', async ({ page }, testInfo) => {
    await page.goto('/de/student/saved')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    // Try to expand the first accordion/detail if it exists
    const firstAccordion = page.locator('[data-state="closed"]').first()
    if (await firstAccordion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAccordion.click()
      await page.waitForTimeout(500)
    }
    await scrubPage(page)
    await page.screenshot({
      path: screenshotPath('student-saved', projectName(testInfo)),
      fullPage: false,
    })
  })
})

// ---------- Parent pages ----------

test.describe('parent', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PARENT_EMAIL, PARENT_PASSWORD)
  })

  test('parent-dashboard', async ({ page }, testInfo) => {
    await page.goto('/de/parent/dashboard')
    await page.waitForLoadState('load')
    await page.waitForTimeout(3000)
    await scrubPage(page)
    await page.screenshot({
      path: screenshotPath('parent-dashboard', projectName(testInfo)),
      fullPage: false,
    })
  })

  test('parent-rewards', async ({ page }, testInfo) => {
    await page.goto('/de/parent/rewards')
    await page.waitForLoadState('load')
    await page.waitForTimeout(3000)
    await scrubPage(page)
    await page.screenshot({
      path: screenshotPath('parent-rewards', projectName(testInfo)),
      fullPage: false,
    })
  })
})

// ---------- Social-asset source captures ----------
// Feeds scripts/make-social-assets.ts. Runs against production with the test
// student account; the calculator part needs no login:
//   PLAYWRIGHT_BASE_URL=https://bonifatus.com SCREENSHOT_STUDENT_EMAIL=... //   SCREENSHOT_STUDENT_PASSWORD=... npx playwright test scripts/take-screenshots.ts //   --project=desktop -g social
// Element screenshots (not viewport crops) so the generator never has to guess
// where a card starts or ends.

const SOCIAL_SOURCE_DIR = path.join(__dirname, '..', 'docs', 'social-content', 'source')

// A plausible Jahreszeugnis for a 7th-grader. Entered by hand instead of using
// "Beispiel laden", whose sample uses a 1–7 scale and subjects like "Hindi".
const SOCIAL_REPORT_CARD: [subject: string, grade: string][] = [
  ['Mathematik', '2'],
  ['Deutsch', '1'],
  ['Englisch', '2'],
  ['Biologie', '3'],
]

// Site chrome that would otherwise land inside element screenshots: the sticky
// header (stamped over elements taller than the viewport) and the floating
// cookie-settings button (fixed bottom-left).
async function hideSiteChrome(page: Page) {
  await page.addStyleTag({
    content: `header { position: static !important; }
      button.fixed.bottom-4.left-4 { display: none !important; }`,
  })
}

test.describe('social', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'run once, via the desktop project')
  })

  test.describe('calculator', () => {
    // >= 1024px so each subject collapses into a single row (lg:grid-cols-12).
    test.use({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 2 })

    test('social-calculator', async ({ page }) => {
      await page.goto('/de/tools/grade-reward-calculator')
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)
      await hideSiteChrome(page)

      // Settings: German 1–6 system and "2. Halbjahr / Jahreszeugnis" are the
      // defaults for /de; set class level and the school year that just ended.
      await page.locator('input[type="number"]').first().fill('7')
      await page.getByPlaceholder(/2025-2026/).fill('2025-2026')

      // Subjects: the page starts with one empty row; add the rest.
      for (let i = 1; i < SOCIAL_REPORT_CARD.length; i++) {
        await page.getByRole('button', { name: 'Fach hinzufügen' }).click()
      }
      const subjectInputs = page.getByPlaceholder('Fach suchen')
      const gradeSelects = page.locator('select').filter({ hasText: 'Note auswählen' })
      for (let i = 0; i < SOCIAL_REPORT_CARD.length; i++) {
        const [subject, grade] = SOCIAL_REPORT_CARD[i]
        // A filled row's placeholder becomes its subject name, so the first
        // "Fach suchen" input is always the next empty row.
        await subjectInputs.nth(0).click()
        await subjectInputs.nth(0).fill(subject)
        await page
          .locator('[data-combobox-item]', { hasText: new RegExp(`^${subject}$`) })
          .first()
          .click()
        await gradeSelects.nth(i).selectOption(grade)
      }
      await page.mouse.click(5, 5) // blur, close any open combobox
      await page.waitForTimeout(800)
      await scrubPage(page)

      const accordion = (title: string) =>
        page
          .locator('div.space-y-4 > div')
          .filter({ has: page.getByText(title, { exact: true }) })
          .first()

      await accordion('Fächer & Noten').screenshot({
        path: path.join(SOCIAL_SOURCE_DIR, 'calc-subjects.png'),
      })

      // Results: clip to the headline total only. The per-subject breakdown
      // below it currently renders the raw tier key ("Deutsch — best-Stufe"),
      // which must not appear in marketing material.
      const results = accordion('Ergebnisse')
      await results.scrollIntoViewIfNeeded()
      const summary = results
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: 'Bonus gesamt' })
      const rBox = await results.boundingBox()
      const sBox = await summary.boundingBox()
      if (!rBox || !sBox) throw new Error('results card not found')
      await page.screenshot({
        path: path.join(SOCIAL_SOURCE_DIR, 'calc-results.png'),
        clip: {
          x: rBox.x,
          y: rBox.y,
          width: rBox.width,
          height: sBox.y + sBox.height + 6 - rBox.y,
        },
      })
    })
  })

  test.describe('student', () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })

    test('social-student-points', async ({ page }) => {
      await login(page, STUDENT_EMAIL, STUDENT_PASSWORD)
      await page.goto('/de/student/dashboard')
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)
      await page.waitForTimeout(2000)
      await hideSiteChrome(page)
      await scrubPage(page)
      // The 2×2 stat grid ("Bonuspunkte gesamt", "Bester Zeitraum", …).
      const grid = page
        .locator('div.grid')
        .filter({ has: page.getByText('Bonuspunkte gesamt') })
        .filter({ has: page.getByText('Bester Zeitraum') })
        .last()
      await grid.screenshot({ path: path.join(SOCIAL_SOURCE_DIR, 'student-points.png') })
    })
  })
})
