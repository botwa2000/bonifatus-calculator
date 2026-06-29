import { test } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

// ---------------------------------------------------------------------------
// Device definitions — phone devices use phone HTML; tablet devices use tablet HTML
// ---------------------------------------------------------------------------
const PHONE_DEVICES = [
  { name: 'iphone-67', platform: 'ios' as const, viewport: { width: 430, height: 932 }, dpr: 3 },
  // → 1290×2796 px  (App Store iPhone 6.7")
  {
    name: 'android-phone',
    platform: 'android' as const,
    viewport: { width: 540, height: 960 },
    dpr: 2,
  },
  // → 1080×1920 px  (Play Store phone)
]

const TABLET_DEVICES = [
  {
    name: 'ipad-pro-129',
    platform: 'ios' as const,
    viewport: { width: 1024, height: 1366 },
    dpr: 2,
  },
  // → 2048×2732 px  (App Store iPad Pro 12.9")
  {
    name: 'android-tablet-7',
    platform: 'android' as const,
    viewport: { width: 600, height: 960 },
    dpr: 2,
  },
  // → 1200×1920 px  (Play Store 7" tablet)
  {
    name: 'android-tablet-10',
    platform: 'android' as const,
    viewport: { width: 800, height: 1280 },
    dpr: 2,
  },
  // → 1600×2560 px  (Play Store 10" tablet)
]

// ---------------------------------------------------------------------------
// Screen file lists
// ---------------------------------------------------------------------------
const PHONE_SCREENS = [
  '01-student-dashboard.html',
  '02-grade-entry.html',
  '03-grade-notes.html',
  '04-calculator.html',
  '05-results.html',
  '06-parent-dashboard.html',
  '07-parent-children.html',
  '08-rewards.html',
]

const TABLET_SCREENS = PHONE_SCREENS // same filenames, different source directory

const FEATURE_GRAPHIC = 'feature-graphic.html'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const PHONE_DIR = path.resolve(__dirname, 'store-screens')
const TABLET_DIR = path.resolve(__dirname, 'store-screens', 'tablet')
const OUTPUT_BASE = path.resolve(__dirname, '..', 'screenshots', 'store')

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ---------------------------------------------------------------------------
// Phone screenshots
// ---------------------------------------------------------------------------
for (const device of PHONE_DEVICES) {
  test.describe(`[${device.platform}] ${device.name}`, () => {
    for (const screenFile of PHONE_SCREENS) {
      test(screenFile, async ({ browser }) => {
        const outputDir = path.join(OUTPUT_BASE, device.platform, device.name)
        ensureDir(outputDir)

        const htmlPath = path.join(PHONE_DIR, screenFile)
        const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`
        const outputFile = path.join(outputDir, screenFile.replace('.html', '.png'))

        const context = await browser.newContext({
          viewport: device.viewport,
          deviceScaleFactor: device.dpr,
        })
        const page = await context.newPage()
        console.log(`  Rendering [${device.name}] ${screenFile} …`)
        await page.goto(fileUrl)
        try {
          await page.waitForLoadState('networkidle', { timeout: 5000 })
        } catch {
          await page.waitForTimeout(500)
        }
        await page.screenshot({ path: outputFile, fullPage: false })
        console.log(`  ✓ ${outputFile}`)
        await context.close()
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Tablet screenshots — proper split-pane layouts
// ---------------------------------------------------------------------------
for (const device of TABLET_DEVICES) {
  test.describe(`[${device.platform}] ${device.name}`, () => {
    for (const screenFile of TABLET_SCREENS) {
      test(screenFile, async ({ browser }) => {
        const outputDir = path.join(OUTPUT_BASE, device.platform, device.name)
        ensureDir(outputDir)

        const htmlPath = path.join(TABLET_DIR, screenFile)
        const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`
        const outputFile = path.join(outputDir, screenFile.replace('.html', '.png'))

        const context = await browser.newContext({
          viewport: device.viewport,
          deviceScaleFactor: device.dpr,
        })
        const page = await context.newPage()
        console.log(`  Rendering [${device.name}] ${screenFile} …`)
        await page.goto(fileUrl)
        try {
          await page.waitForLoadState('networkidle', { timeout: 5000 })
        } catch {
          await page.waitForTimeout(500)
        }
        await page.screenshot({ path: outputFile, fullPage: false })
        console.log(`  ✓ ${outputFile}`)
        await context.close()
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Play Store feature graphic  (1024×500, dpr:1)
// ---------------------------------------------------------------------------
test.describe('feature-graphic', () => {
  test(FEATURE_GRAPHIC, async ({ browser }) => {
    const outputDir = path.join(OUTPUT_BASE, 'play-store')
    ensureDir(outputDir)

    const htmlPath = path.join(PHONE_DIR, FEATURE_GRAPHIC)
    const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`
    const outputFile = path.join(outputDir, 'feature-graphic.png')

    const context = await browser.newContext({
      viewport: { width: 1024, height: 500 },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    console.log('  Rendering feature-graphic.html …')
    await page.goto(fileUrl)
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 })
    } catch {
      await page.waitForTimeout(500)
    }
    await page.screenshot({ path: outputFile, fullPage: false })
    console.log(`  ✓ ${outputFile}`)
    await context.close()
  })
})
