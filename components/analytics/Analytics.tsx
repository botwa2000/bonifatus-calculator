'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const CONSENT_KEY = 'bonifatus-cookie-consent'
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function Analytics() {
  const [gaEnabled, setGaEnabled] = useState(false)

  useEffect(() => {
    const check = () => {
      try {
        const raw = localStorage.getItem(CONSENT_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          setGaEnabled(parsed?.analytics === true)
        }
      } catch {}
    }
    check()
    window.addEventListener('storage', check)
    window.addEventListener('bonifatus-consent-updated', check)
    return () => {
      window.removeEventListener('storage', check)
      window.removeEventListener('bonifatus-consent-updated', check)
    }
  }, [])

  if (!GA_ID || !gaEnabled) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
    </>
  )
}
