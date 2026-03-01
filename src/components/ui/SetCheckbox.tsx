'use client'

import { cn } from '@/lib/utils'
import './set-checkbox.css'

interface SetCheckboxProps {
  checked: boolean
  met: boolean       // true = at or above target
  onChange: (checked: boolean) => void
  className?: string
}

export function SetCheckbox({ checked, met, onChange, className }: SetCheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'set-checkbox',
        !checked && 'set-checkbox--unchecked',
        checked && met && 'set-checkbox--met',
        checked && !met && 'set-checkbox--missed',
        className
      )}
    >
      {checked ? (met ? '✓' : '–') : ''}
    </button>
  )
}
