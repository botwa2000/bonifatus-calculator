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
