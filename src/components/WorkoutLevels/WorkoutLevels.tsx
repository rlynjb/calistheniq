'use client'

import { Badge, ExerciseCard } from '@/components/ui'
import type { BaseExercise, BaseExerciseSet } from '@/types'
import { workoutLevels } from '@/data/WorkoutLevels'
import './WorkoutLevels.css'

export default function WorkoutLevels() {
  return (
    <div className="workout-levels">
      <div className="workout-levels__description">
        Progressive calisthenics exercises organized by difficulty levels
      </div>
      
      <div className="workout-levels__container">
        {Object.entries(workoutLevels).map(([levelKey, level], levelIndex) => (
          <div key={levelKey} className="workout-levels__level-card">
            <div className="workout-levels__level-header">
              <Badge variant="outline" className="workout-levels__level-badge">
                Level {levelIndex}
              </Badge>
              <h3 className="workout-levels__level-title">{level.name}</h3>
            </div>
            
            {level.description && (
              <p className="workout-levels__level-description">{level.description}</p>
            )}
            
            <div className="workout-levels__categories-grid">
              {Object.entries(level.exercises).map(([category, exercises]) => (
                <div key={category} className="workout-levels__category">
                  <h4 className="workout-levels__category-title">
                    {category}
                  </h4>
                  
                  <div className="workout-levels__exercises">
                    {exercises.map((exercise: BaseExercise, exerciseIndex: number) => (
                      <ExerciseCard 
                        key={exerciseIndex} 
                        exercise={exercise}
                        className="workout-levels__exercise-card"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Level Guidelines */}
      <div className="workout-levels__guidelines">
        <div className="workout-levels__guidelines-header">
          <div className="workout-levels__guidelines-icon">💡</div>
          <div className="workout-levels__guidelines-title">Progression Guidelines</div>
        </div>
        <div className="workout-levels__guidelines-content">
          <p className="workout-levels__guideline-item">• <strong>Level 0 (Foundation):</strong> Focus on stability, control, and knee-friendly movements with mini band assistance</p>
          <p className="workout-levels__guideline-item">• Complete all exercises in your current level with proper form before advancing</p>
          <p className="workout-levels__guideline-item">• Master at least 80% of the target reps/duration for each exercise</p>
          <p className="workout-levels__guideline-item">• Focus on quality over quantity - perfect form is essential</p>
          <p className="workout-levels__guideline-item">• Rest adequately between workouts (48-72 hours for same muscle groups)</p>
          <p className="workout-levels__guideline-item">• If experiencing knee discomfort, start with Level 0 and progress slowly</p>
        </div>
      </div>
    </div>
  )
}
