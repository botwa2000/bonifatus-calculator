import type { Config } from 'tailwindcss'

// Tailwind CSS v4 uses CSS-based configuration via @theme in globals.css
// This file is kept for backward compatibility and to configure content paths
const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
}

export default config
