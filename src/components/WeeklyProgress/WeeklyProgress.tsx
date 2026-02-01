'use client'

import { useState, useEffect } from 'react'
import { CardDescription } from '@/components/ui/card'
import { ExerciseCard, Modal } from '@/components/ui'
import { 
  type WeekDay,
} from '@/lib/data-service/mock-data/WeeklyProgress'
import { dataService } from '@/lib/data-service'
import './WeeklyProgress.css'

export default function WeeklyProgress() {
  const [progressData, setProgressData] = useState<{ weekDays: WeekDay[] }>({ weekDays: [] })
  const [isClient, setIsClient] = useState(false)
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const fetchProgress = async () => {
      const data = await dataService.userProgress.getWeeklyProgress()
      setProgressData(data)
    }
    
    fetchProgress()
  }, [])

  const { weekDays } = progressData

  const handleDayClick = (day: WeekDay) => {
    if (day.completedWorkout || day.todayWorkout) {
      setSelectedDay(day)
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDay(null)
  }

  return (
    <div className="weekly-progress">
      {!isClient || weekDays.length === 0 ? (
        <div className="weekly-progress__loading">
          <div className="weekly-progress__loading-header">
            <div>
              <CardDescription>Loading your weekly progress...</CardDescription>
            </div>
            <div className="weekly-progress__loading-streak">
              <div className="weekly-progress__loading-streak-number">-</div>
              <div className="weekly-progress__loading-streak-label">Day Streak</div>
            </div>
          </div>
          <div className="weekly-progress__loading-grid">
            {Array.from({ length: 7 }, (_, index) => (
              <div
                key={index}
                className="weekly-progress__loading-day"
              >
                <div className="weekly-progress__loading-day-name">-</div>
                <div className="weekly-progress__loading-day-number">-</div>
                <div className="weekly-progress__loading-day-indicator">
                  <div className="weekly-progress__loading-day-dot"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="weekly-progress__content">
          {/* Week header (optional visual improvement) */}
          <div className="weekly-progress__week-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel, index) => (
              <div key={index} className="weekly-progress__day-label">
                {dayLabel}
              </div>
            ))}
          </div>
          
          <div className="weekly-progress__grid">
            {weekDays.map((day: WeekDay, index: number) => (
              <div
                key={index}
                className={`weekly-progress__day ${
                  day.isToday
                    ? 'weekly-progress__day--today'
                    : day.completed
                      ? 'weekly-progress__day--completed'
                      : 'weekly-progress__day--default'
                } ${(day.completedWorkout || day.todayWorkout) ? 'weekly-progress__day--with-workout' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="weekly-progress__day-name">{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="weekly-progress__day-number">{day.date.getDate()}</div>
                <div className="weekly-progress__day-indicator">
                  {day.completed ? (
                    <div className="weekly-progress__day-indicator--completed">✓</div>
                  ) : day.isToday ? (
                    <div className="weekly-progress__day-indicator--today"></div>
                  ) : (
                    <div className="weekly-progress__day-indicator--default"></div>
                  )}
                </div>
                
                {/* Exercise count indicator */}
                {day.completedWorkout && (
                  <div className="weekly-progress__exercise-count weekly-progress__exercise-count--completed">
                    {day.completedWorkout.exercises.length} ex
                  </div>
                )}
                {day.todayWorkout && (
                  <div className="weekly-progress__exercise-count weekly-progress__exercise-count--planned">
                    {day.todayWorkout.exercises.length} planned
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Exercise Details Modal */}
          <Modal 
            isOpen={isModalOpen} 
            onClose={closeModal}
            title={selectedDay ? `${selectedDay.date.toLocaleDateString('en-US', { weekday: 'short' })} (${selectedDay.date.getDate()}) - Workout Details` : 'Workout Details'}
          >
            {selectedDay && (
              <div className="weekly-progress__modal-content">
                {selectedDay.completedWorkout && (
                  <div className="weekly-progress__workout-section weekly-progress__workout-section--completed">
                    <div className="weekly-progress__workout-meta weekly-progress__workout-meta--completed">
                      Completed: {selectedDay.completedWorkout.date.toLocaleString('en-US', { 
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
                      Today: {selectedDay.todayWorkout.date.toLocaleString('en-US', { 
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
            )}
          </Modal>
        </div>
      )}
    </div>
  )
}
