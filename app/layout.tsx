import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { IdleLogoutGuard } from '@/components/auth/IdleLogoutGuard'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Bonifatus - School Grades Bonus Calculator for Parents',
  description:
    'Motivate academic excellence through smart rewards. A progressive web app that helps parents reward their children for academic achievement through a transparent, configurable bonus points system.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <IdleLogoutGuard />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
