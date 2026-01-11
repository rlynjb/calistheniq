import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CalisthenIQ - AI-Powered Calisthenics Coach',
  description: 'AI-powered calisthenics coach focused on helping beginners build strength safely through proper form, controlled progressions, and body awareness.',
  keywords: ['calisthenics', 'fitness', 'AI coach', 'bodyweight', 'strength training'],
  authors: [{ name: 'CalisthenIQ Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  )
}
