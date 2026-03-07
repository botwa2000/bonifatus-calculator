import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bonifatus.app',
  appName: 'Bonifatus',
  webDir: 'out',

  server: {
    // Load the live web app — no static export needed.
    // Override per-environment via capacitor.config.dev.ts or CLI flags.
    url: 'https://bonifatus.com',
    cleartext: false,
  },

  android: {
    // Allow mixed content for dev (http localhost)
    allowMixedContent: false,
    backgroundColor: '#7c3aed',
  },

  ios: {
    backgroundColor: '#7c3aed',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#7c3aed',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#7c3aed',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
