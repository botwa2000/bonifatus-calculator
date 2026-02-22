import { test, expect, type Page } from '@playwright/test'
import path from 'path'

const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'images', 'screenshots')

const STUDENT_EMAIL = process.env.SCREENSHOT_STUDENT_EMAIL || 'max@example.com'
const STUDENT_PASSWORD = process.env.SCREENSHOT_STUDENT_PASSWORD || 'Test1234!@#$'
const PARENT_EMAIL = process.env.SCREENSHOT_PARENT_EMAIL || 'anna@example.com'
const PARENT_PASSWORD = process.env.SCREENSHOT_PARENT_PASSWORD || 'Test1234!@#$'

async function login(page: Page, email: string, password: string) {
  await page.goto('/de/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  // Wait for navigation away from login page
  await page.waitForURL(/\/(?:student|parent|dashboard)/, { timeout: 30_000 })
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
  // Give animations time to settle
  await page.waitForTimeout(1500)
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
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: screenshotPath('parent-dashboard', projectName(testInfo)),
      fullPage: false,
    })
  })

  test('parent-rewards', async ({ page }, testInfo) => {
    await page.goto('/de/parent/rewards')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: screenshotPath('parent-rewards', projectName(testInfo)),
      fullPage: false,
    })
  })
})
