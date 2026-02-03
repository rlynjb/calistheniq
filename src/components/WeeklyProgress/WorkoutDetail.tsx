import { ExerciseCard } from '@/components/ui'
import type { ExtendedWeekDay } from './WeeklyProgress'

interface WorkoutDetailProps {
  selectedDay: ExtendedWeekDay
}

export default function WorkoutDetail({ selectedDay }: WorkoutDetailProps) {
  return (
    <div className="weekly-progress__modal-content">
      {selectedDay.completedWorkout && (
        <div className="weekly-progress__workout-section weekly-progress__workout-section--completed">
          <div className="weekly-progress__workout-meta weekly-progress__workout-meta--completed">
            Completed: {new Date(selectedDay.completedWorkout.date).toLocaleString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })} | 
            Duration: {selectedDay.completedWorkout.duration}min | 
            Categories: {selectedDay.completedWorkout.categories.join(', ')}
          </div>
          <div className="weekly-progress__exercise-list">
            {selectedDay.completedWorkout.exercises.map((exercise, exIndex) => (
              <ExerciseCard 
                key={exIndex}
                exercise={exercise}
                className="weekly-progress__exercise-card weekly-progress__exercise-card--completed"
              />
            ))}
          </div>
        </div>
      )}
      
      {selectedDay.todayWorkout && (
        <div className="weekly-progress__workout-section weekly-progress__workout-section--planned">
          <div className="weekly-progress__workout-meta weekly-progress__workout-meta--planned">
            Today: {new Date(selectedDay.todayWorkout.date).toLocaleString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })} | 
            Duration: {selectedDay.todayWorkout.duration}min | 
            Categories: {selectedDay.todayWorkout.categories.join(', ')}
          </div>
          <div className="weekly-progress__exercise-list">
            {selectedDay.todayWorkout.exercises.map((exercise, exIndex) => (
              <ExerciseCard 
                key={exIndex}
                exercise={exercise}
                className="weekly-progress__exercise-card weekly-progress__exercise-card--planned"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}