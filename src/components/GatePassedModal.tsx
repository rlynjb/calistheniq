'use client'

import { useEffect, useRef } from 'react'
import type { Category } from '@/types'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { LEVEL_NAMES } from '@/lib/constants'
import './gate-passed-modal.css'

interface GatePassedModalProps {
  category: Category
  oldLevel: number
  newLevel: number
  onClose: () => void
}

export function GatePassedModal({ category, oldLevel, newLevel, onClose }: GatePassedModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Auto-focus Continue button + close on Escape
  useEffect(() => {
    buttonRef.current?.focus()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="gate-modal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Level up: ${category} advanced to level ${newLevel}`}
    >
      <div
        className="gate-modal__card"
        onClick={e => e.stopPropagation()}
      >
        <div className="gate-modal__badge-row">
          <CategoryBadge category={category} className="gate-modal__badge-override" />
        </div>

        <h2 className="gate-modal__title">
          LEVEL UP!
        </h2>

        <div className="gate-modal__levels">
          <div className="gate-modal__level">
            <p className="gate-modal__level-num--old">{oldLevel}</p>
            <p className="gate-modal__level-name--old">{LEVEL_NAMES[oldLevel]}</p>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="gate-modal__arrow" aria-hidden="true">
            <path d="M5 12h14m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="gate-modal__level">
            <p className="gate-modal__level-num--new">{newLevel}</p>
            <p className="gate-modal__level-name--new">{LEVEL_NAMES[newLevel]}</p>
          </div>
        </div>

        <button
          ref={buttonRef}
          onClick={onClose}
          className="btn-primary"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
