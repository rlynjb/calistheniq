'use client'

import { Badge } from '@/components/ui/badge'
import type { BaseExercise, BaseExerciseSet } from '@/lib/data-service/ExerciseService/mocks/types'
import './exercise-card.css'

/**
 * ExerciseCard - Reusable component for displaying exercise information
 * 
 * Features:
 * - Exercise name and equipment badges
 * - Sets information with reps/duration
 * - Tempo and rest period display
 * - Consistent dark theme styling
 * - Customizable className for additional styling
 */
interface ExerciseCardProps {
  exercise: BaseExercise
  className?: string
}

export default function ExerciseCard({ exercise, className = '' }: ExerciseCardProps) {
  return (
    <div className={`exercise-card ${className}`}>
      <h5 className="exercise-card__name">{exercise.name}</h5>
      
      {exercise.equipment && (
        <div className="exercise-card__equipment-badge">
          <Badge variant="outline" className="exercise-card__equipment-badge-inner">
            {exercise.equipment}
          </Badge>
        </div>
      )}
      
      <div className="exercise-card__sets-info">
        {/* Sets, Tempo, and Rest in one line */}
        <div className="exercise-card__sets-row">
          <span className="exercise-card__sets-label">{exercise.sets.length} Sets: </span>
          <span className="exercise-card__sets-list">
            {exercise.sets.map((set: BaseExerciseSet, index: number) => 
              'reps' in set ? set.reps : `${set.duration}s`
            ).join(' → ')}
          </span>
        </div>
        
        <div className="exercise-card__exercise-meta">
          <span className="exercise-card__meta-label">Tempo: </span>
          <span className="exercise-card__meta-value">{exercise.tempo}</span>
          <span className="exercise-card__meta-label exercise-card__meta-label--spaced">Rest: </span>
          <span className="exercise-card__meta-value">{exercise.rest}s</span>
        </div>
      </div>
      
      {exercise.notes && (
        <div className="exercise-card__notes">
          💡 {exercise.notes}
        </div>
      )}
    </div>
  )
}
