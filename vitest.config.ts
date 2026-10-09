import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'mobile/**'],
    // next-intl's middleware imports `next/server` without the .js extension.
    server: { deps: { inline: ['next-intl'] } },
  },
})
