import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

// ---------------------------------------------------------------------------
// Device definitions
// ---------------------------------------------------------------------------
const DEVICES = [
  // Apple App Store
  {
    name: 'iphone-67',
    platform: 'ios' as const,
    viewport: { width: 430, height: 932 },
    dpr: 3,
  },
  {
    name: 'ipad-pro-129',
    platform: 'ios' as const,
    viewport: { width: 1024, height: 1366 },
    dpr: 2,
  },
  // Google Play Store
  {
    name: 'android-phone',
    platform: 'android' as const,
    viewport: { width: 540, height: 960 },
    dpr: 2,
  },
  {
    name: 'android-tablet-7',
    platform: 'android' as const,
    viewport: { width: 600, height: 960 },
    dpr: 2,
  },
  {
    name: 'android-tablet-10',
    platform: 'android' as const,
    viewport: { width: 800, height: 1280 },
    dpr: 2,
  },
]

// ---------------------------------------------------------------------------
// Screen definitions
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

const FEATURE_GRAPHIC = 'feature-graphic.html'

// Paths
const SCREENS_DIR = path.resolve(__dirname, 'store-screens')
const OUTPUT_BASE = path.resolve(__dirname, '..', 'screenshots', 'store')

// ---------------------------------------------------------------------------
// Helper: ensure directory exists
// ---------------------------------------------------------------------------
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// ---------------------------------------------------------------------------
// Tests: phone screens for each device
// ---------------------------------------------------------------------------
for (const device of DEVICES) {
  test.describe(`[${device.platform}] ${device.name}`, () => {
    for (const screenFile of PHONE_SCREENS) {
      test(`${screenFile}`, async ({ browser }) => {
        const outputDir = path.join(OUTPUT_BASE, device.platform, device.name)
        ensureDir(outputDir)

        const htmlPath = path.join(SCREENS_DIR, screenFile)
        const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`
        const outputFile = path.join(outputDir, screenFile.replace('.html', '.png'))

        const context = await browser.newContext({
          viewport: device.viewport,
          deviceScaleFactor: device.dpr,
        })

        const page = await context.newPage()

        console.log(`  Rendering [${device.name}] ${screenFile} …`)
        await page.goto(fileUrl)

        // Wait for fonts / images to settle. networkidle can be slow for file://
        // so we use a small fixed delay as fallback.
        try {
          await page.waitForLoadState('networkidle', { timeout: 5000 })
        } catch {
          await page.waitForTimeout(500)
        }

        await page.screenshot({
          path: outputFile,
          fullPage: false,
        })

        console.log(`  ✓ Saved → ${outputFile}`)
        await context.close()
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Tests: feature graphic (fixed 1024×500, dpr:1, no device scaling)
// ---------------------------------------------------------------------------
test.describe('feature-graphic', () => {
  test('feature-graphic.html', async ({ browser }) => {
    const outputDir = path.join(OUTPUT_BASE, 'play-store')
    ensureDir(outputDir)

    const htmlPath = path.join(SCREENS_DIR, FEATURE_GRAPHIC)
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

    await page.screenshot({
      path: outputFile,
      fullPage: false,
    })

    console.log(`  ✓ Saved → ${outputFile}`)
    await context.close()
  })
})
