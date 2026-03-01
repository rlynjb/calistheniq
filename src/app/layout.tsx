import type { Metadata, Viewport } from 'next'
import { Chakra_Petch, Share_Tech_Mono } from 'next/font/google'
import './globals.css'
import './app-shell.css'
import { MSWProvider } from '@/mocks'
import { BottomNav } from '@/components/layout/BottomNav'

// next/font/google: self-hosted, zero layout shift, no external request
const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'contrl — Calisthenics Tracker',
  description: 'Progressive calisthenics tracker with gate-based level progression',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'contrl',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#00e5ff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${chakraPetch.variable} ${shareTechMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <MSWProvider>
          <header className="app-shell__header">
            <span className="app-shell__wordmark">
              contrl
            </span>
          </header>
          <main className="app-shell__main">
            {children}
          </main>
          <BottomNav />
        </MSWProvider>
      </body>
    </html>
  )
}
