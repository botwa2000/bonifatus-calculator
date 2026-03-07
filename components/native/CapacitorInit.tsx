'use client'

import { useEffect } from 'react'
import { initNative } from '@/lib/capacitor'

export function CapacitorInit() {
  useEffect(() => {
    initNative()
  }, [])

  return null
}
