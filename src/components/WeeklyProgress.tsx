'use client'

import { useState, useEffect } from 'react'
import { CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  weeklyProgressData, 
  generateCompleteWeeklyProgress,
  type WeekDay 
} from '@/data/WeeklyProgress'

export default function WeeklyProgress() {
  const [progressData, setProgressData] = useState(weeklyProgressData)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Regenerate data on client to ensure fresh dates
    setProgressData(generateCompleteWeeklyProgress())
  }, [])

  const { weekDays, stats, motivationalMessage, achievements } = progressData
  const reversedWeekDays = [...weekDays].reverse()

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
          <div className="grid grid-cols-7 gap-2">
            {reversedWeekDays.map((day: WeekDay, index: number) => (
              <div
                key={index}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                  day.isToday
                    ? 'border-primary bg-primary/10'
                    : day.completed
                      ? 'border-green-200 bg-green-50'
                      : 'border-border bg-card'
                }`}
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
              </div>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                🔥 {stats.streakCount} day streak
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                💪 {stats.xpEarned} XP earned
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.completedDays === 7 
                ? "Perfect week! 🎉" 
                : `${7 - stats.completedDays} more to complete the week`
              }
            </div>
          </div>
          
          {/* Motivational Message */}
          {motivationalMessage && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-800">{motivationalMessage}</div>
            </div>
          )}
          
          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="mt-3 space-y-1">
              {achievements.slice(0, 2).map((achievement, index) => (
                <div key={index} className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full inline-block mr-2">
                  {achievement}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
