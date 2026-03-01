'use client'

import type { Category } from '@/types'
import { CATEGORIES } from '@/types'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { GlowCard } from '@/components/ui/GlowCard'
import { LEVEL_NAMES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types'
import exerciseData from '@/data/exercises.json'

const typedExercises = exerciseData as Exercise[]

interface ExerciseSelectorProps {
  userLevels: Record<Category, number>
  categoryDoneThisWeek: Record<Category, boolean>
  onSelect: (category: Category) => void
}

export function ExerciseSelector({
  userLevels,
  categoryDoneThisWeek,
  onSelect,
}: ExerciseSelectorProps) {
  return (
    <div className="exercise-selector">
      <div className="exercise-selector__header">
        <h1 className="exercise-selector__title">Camera Workout</h1>
        <p className="exercise-selector__subtitle">
          Select a category to start tracking with your camera
        </p>
      </div>

      {CATEGORIES.map(cat => {
        const done = categoryDoneThisWeek[cat]
        const level = userLevels[cat]
        const exerciseCount = typedExercises.filter(
          e => e.category === cat && e.level === level
        ).length

        return (
          <GlowCard
            key={cat}
            glow={done ? 'none' : cat}
            className={cn(
              'exercise-selector__card',
              done && 'exercise-selector__card--dimmed'
            )}
          >
            <button
              type="button"
              className="exercise-selector__card-btn"
              onClick={() => onSelect(cat)}
              disabled={done}
            >
              <div className="exercise-selector__card-info">
                <CategoryBadge category={cat} />
                <div>
                  <p className="exercise-selector__card-level">
                    Level {level}
                    <span className="exercise-selector__card-level-name">
                      {LEVEL_NAMES[level] ?? ''}
                    </span>
                  </p>
                  {done ? (
                    <p className="exercise-selector__done-text">Done this week</p>
                  ) : (
                    <p className="exercise-selector__card-exercises">
                      {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              {!done && (
                <span className="exercise-selector__card-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              )}
            </button>
          </GlowCard>
        )
      })}
    </div>
  )
}
