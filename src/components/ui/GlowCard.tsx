'use client'

import { cn } from '@/lib/utils'
import './glow-card.css'

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  glow?: 'cyan' | 'emerald' | 'amber' | 'push' | 'pull' | 'squat' | 'none'
  onClick?: () => void
}

export function GlowCard({ children, className, glow = 'none', onClick }: GlowCardProps) {
  return (
    <div
      className={cn(
        'glow-card',
        `glow-card--${glow}`,
        onClick && 'glow-card--clickable',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
