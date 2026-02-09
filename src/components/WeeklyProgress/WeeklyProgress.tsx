'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui'
import { api } from '@/api'
import type { WeekDay, WorkoutSession } from '@/api'
import { MOCK_UserData } from '@/mocks'
import WorkoutDetail from './WorkoutDetail'
import './WeeklyProgress.css'

export type ExtendedWeekDay = WeekDay & Partial<WorkoutSession>

// Generate week days based on current date
const generateWeekDays = (): WeekDay[] => {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 6 = Saturday
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - currentDay) // Go to Sunday
  weekStart.setHours(0, 0, 0, 0) // Reset to midnight

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const dateISO = date.toISOString()
    const isToday = date.toDateString() === today.toDateString()

    return {
      date: new Date(dateISO),
      isToday,
      completed: false,
      completedWorkout: undefined,
      todayWorkout: undefined
    }
  })
}

export default function WeeklyProgress() {
  const [weekDays, setWeekDays] = useState<ExtendedWeekDay[]>([])
  const [selectedDay, setSelectedDay] = useState<ExtendedWeekDay | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch user data and merge with generated week
  const refreshWeeklyProgress = useCallback(async () => {
    const generatedWeek = generateWeekDays()
    let fetchedUserData = await api.user.getUserData()

    // Initialize with mock data if no user data exists
    if (!fetchedUserData) {
      await api.user.updateUserData(MOCK_UserData)
      fetchedUserData = MOCK_UserData
    }

    const weeklyProgress = fetchedUserData?.weeklyProgress

    if (Array.isArray(weeklyProgress) && weeklyProgress.length > 0) {
      const mergedWeek = generatedWeek.map(day => {
        const weekDay = day.date.toDateString()

        const workoutDay = weeklyProgress.find(
          wp => new Date(wp.date).toDateString() === weekDay
        )

        return {
          ...day,
          isWorkoutDay: Boolean(workoutDay?.exercises?.length),
          ...(workoutDay || {}),
          date: day.date // Keep the date object
        }
      })
      setWeekDays(mergedWeek)

      // Update selectedDay if it exists to reflect changes
      if (selectedDay) {
        const updatedSelectedDay = mergedWeek.find(
          day => day.date.toDateString() === new Date(selectedDay.date).toDateString()
        )
        if (updatedSelectedDay) {
          setSelectedDay(updatedSelectedDay)
        }
      }
    } else {
      setWeekDays(generatedWeek)
    }
  }, [selectedDay])

  useEffect(() => {
    refreshWeeklyProgress()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDayClick = (day: WeekDay) => {
    setSelectedDay(day)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDay(null)
  }

  const hightlightDay = (day: WeekDay) => {
    return day.isToday ? 'weekly-progress__day--today' :
      day.isWorkoutDay ? 'weekly-progress__day--workout' : ''
  }

  const modalTitle = selectedDay
    ? `${new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'short' })} (${new Date(selectedDay.date).getDate()}) - Workout Details`
    : 'Workout Details'

  return (
    <div className="weekly-progress">
      {/* Week header */}
      <div className="weekly-progress__week-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel, index) => (
          <div key={index} className="weekly-progress__day-label">
            {dayLabel}
          </div>
        ))}
      </div>
          
      <div className="weekly-progress__grid">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`weekly-progress__day ${hightlightDay(day)}`}
            onClick={() => handleDayClick(day)}
          >
            <div className="weekly-progress__day-name">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="weekly-progress__day-number">{new Date(day.date).getDate()}</div>
            <div className="weekly-progress__day-indicator">
              {day.completed ? (
                <div className="weekly-progress__day-indicator--completed">✓</div>
              ) : day.isToday ? (
                <div className="weekly-progress__day-indicator--today"></div>
              ) : (
                <div className="weekly-progress__day-indicator--default"></div>
              )}
            </div>
            <div className="weekly-progress__day-category">{day.isWorkoutDay ? day.categories : ''}</div>
          </div>
        ))}
      </div>
      
      {/* Exercise Details Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={modalTitle}
      >
        {selectedDay && (
          <WorkoutDetail
            selectedDay={selectedDay}
            onWorkoutUpdate={refreshWeeklyProgress}
          />
        )}
      </Modal>
    </div>
  )
}
