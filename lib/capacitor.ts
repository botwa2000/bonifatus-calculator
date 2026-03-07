'use client'

import { Capacitor } from '@capacitor/core'

/**
 * Whether the app is running inside a native Capacitor shell (Android/iOS).
 */
export const isNative = Capacitor.isNativePlatform()

/**
 * Current native platform: 'android' | 'ios' | 'web'
 */
export const platform = Capacitor.getPlatform()

/**
 * Initialize native plugins (status bar, back button, keyboard).
 * Safe to call on web — guards with isNative.
 */
export async function initNative() {
  if (!isNative) return

  const { StatusBar, Style } = await import('@capacitor/status-bar')
  const { App: CapApp } = await import('@capacitor/app')

  // Style status bar
  StatusBar.setStyle({ style: Style.Light }).catch(() => {})
  StatusBar.setBackgroundColor({ color: '#7c3aed' }).catch(() => {})

  // Handle Android back button — go back in WebView history or exit
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      CapApp.exitApp()
    }
  })
}
