import { defineConfig } from '@playwright/test'

export default defineConfig({
  testMatch: ['**/render-store-screenshots.ts'],
  retries: 0,
  reporter: 'list',
  use: {
    // Chromium only — matches what the Play/App Store review teams use
    // for rendering previews; no Firefox or WebKit needed.
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        // Disable GPU sandbox to allow headless screenshot rendering on CI
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
  ],
})
