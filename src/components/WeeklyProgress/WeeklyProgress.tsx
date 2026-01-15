'use client'

import { useState, useEffect } from 'react'
import { CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { 
  weeklyProgressData, 
  generateCompleteWeeklyProgress,
  type WeekDay,
} from '@/data/WeeklyProgress'
import './WeeklyProgress.css'

export default function WeeklyProgress() {
  const [progressData, setProgressData] = useState(weeklyProgressData)
  const [isClient, setIsClient] = useState(false)
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Regenerate data on client to ensure fresh dates
    setProgressData(generateCompleteWeeklyProgress())
  }, [])

  const { weekDays, stats, motivationalMessage, achievements } = progressData

  const handleDayClick = (day: WeekDay) => {
    if (day.workoutSession || day.plannedWorkout) {
      setSelectedDay(day)
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDay(null)
  }

  return (
    <div>
      {!isClient || weekDays.length === 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardDescription>Loading your weekly progress...</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">-</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-3 rounded-lg border-2 border-border bg-card animate-pulse"
              >
                <div className="text-xs text-muted-foreground mb-1">-</div>
                <div className="text-sm font-medium mb-2">-</div>
                <div className="flex items-center justify-center w-6 h-6">
                  <div className="w-3 h-3 border-2 border-muted-foreground/30 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Week header (optional visual improvement) */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel, index) => (
              <div key={index} className="text-center text-xs text-muted-foreground font-medium py-1">
                {dayLabel}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day: WeekDay, index: number) => (
              <div
                key={index}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  day.isToday
                    ? 'border-primary bg-primary/10'
                    : day.completed
                      ? 'border-green-600 bg-green-600/10 hover:bg-green-600/20'
                      : 'border-border bg-card'
                } ${(day.workoutSession || day.plannedWorkout) ? 'hover:shadow-md' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
                <div className="text-sm font-medium mb-2">{day.dayNum}</div>
                <div className="flex items-center justify-center w-6 h-6">
                  {day.completed ? (
                    <div className="text-green-600 text-lg">✓</div>
                  ) : day.isToday ? (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 border-2 border-muted-foreground/30 rounded-full"></div>
                  )}
                </div>
                
                {/* Exercise count indicator */}
                {day.workoutSession && (
                  <div className="text-xs text-green-600 mt-1">
                    {day.workoutSession.exercises.length} ex
                  </div>
                )}
                {day.plannedWorkout && (
                  <div className="text-xs text-blue-600 mt-1">
                    {day.plannedWorkout.exercises.length} planned
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Exercise Details Modal */}
          <Modal 
            isOpen={isModalOpen} 
            onClose={closeModal}
            title={selectedDay ? `${selectedDay.day} (${selectedDay.dayNum}) - Workout Details` : 'Workout Details'}
          >
            {selectedDay && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {selectedDay.completed && <Badge variant="outline" className="text-xs">Completed</Badge>}
                  {selectedDay.isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                </div>
                
                {selectedDay.workoutSession && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-green-800">Completed Workout</h3>
                    <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded-lg">
                      Duration: {selectedDay.workoutSession.duration}min | 
                      XP: {selectedDay.workoutSession.xpEarned} | 
                      Categories: {selectedDay.workoutSession.categories.join(', ')}
                    </div>
                    <div className="space-y-2">
                      {selectedDay.workoutSession.exercises.map((exercise, exIndex) => (
                        <div key={exIndex} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-300">
                          <div className="font-medium text-green-900">{exercise.name}</div>
                          <div className="text-sm text-green-700 mt-1">
                            {exercise.sets.map((set, setIndex) => 
                              'reps' in set ? `${set.reps} reps` : `${set.duration}s`
                            ).join(' → ')}
                          </div>
                          {exercise.equipment && (
                            <div className="text-xs text-green-600 mt-1">
                              Equipment: {exercise.equipment}
                            </div>
                          )}
                          {exercise.tempo && (
                            <div className="text-xs text-green-600">
                              Tempo: {exercise.tempo}
                            </div>
                          )}
                          {exercise.rest && (
                            <div className="text-xs text-green-600">
                              Rest: {exercise.rest}s
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDay.plannedWorkout && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-blue-800">Planned Workout</h3>
                    <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                      Planned Duration: {selectedDay.plannedWorkout.duration}min | 
                      Expected XP: {selectedDay.plannedWorkout.xpEarned} | 
                      Categories: {selectedDay.plannedWorkout.categories.join(', ')}
                    </div>
                    <div className="space-y-2">
                      {selectedDay.plannedWorkout.exercises.map((exercise, exIndex) => (
                        <div key={exIndex} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-300">
                          <div className="font-medium text-blue-900">{exercise.name}</div>
                          <div className="text-sm text-blue-700 mt-1">
                            {exercise.sets.map((set, setIndex) => 
                              'reps' in set ? `${set.reps} reps` : `${set.duration}s`
                            ).join(' → ')}
                          </div>
                          {exercise.equipment && (
                            <div className="text-xs text-blue-600 mt-1">
                              Equipment: {exercise.equipment}
                            </div>
                          )}
                          {exercise.tempo && (
                            <div className="text-xs text-blue-600">
                              Tempo: {exercise.tempo}
                            </div>
                          )}
                          {exercise.rest && (
                            <div className="text-xs text-blue-600">
                              Rest: {exercise.rest}s
                            </div>
                          )}
                          {exercise.notes && (
                            <div className="text-xs text-blue-600 mt-1 italic">
                              💡 {exercise.notes}
                            </div>
                          )}
                        </div>
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
