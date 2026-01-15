// WeeklyProgress Normalization Functions
// Business logic for processing weekly progress data

import { WeekDay, WeeklyStats, WeeklyProgressData, mockWeeklyProgressData } from './mock'

/**
 * Generate weekly progress data for the past 7 days
 * Creates deterministic completion pattern to avoid hydration mismatch
 */
export function generateWeeklyProgress(): WeekDay[] {
  const today = new Date()
  const weekDays: WeekDay[] = []
  
  // Get the past 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    
    // Deterministic completion based on date (to avoid hydration mismatch)
    // Use day of month to create consistent pattern
    const dayNum = date.getDate()
    const completed = (dayNum % 3 !== 0) && i !== 0 && i !== 1 // Skip today and yesterday, pattern based on date
    
    weekDays.push({
      date,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: dayNum,
      completed,
      isToday: i === 0,
    })
  }
  
  return weekDays
}

/**
 * Calculate weekly statistics from week days data
 */
export function calculateWeeklyStats(weekDays: WeekDay[]): WeeklyStats {
  const completedDays = weekDays.filter(day => day.completed).length
  const reversedWeekDays = [...weekDays].reverse()
  const currentStreak = reversedWeekDays.findIndex(day => !day.completed)
  const streakCount = currentStreak === -1 ? weekDays.length - 1 : currentStreak
  
  return {
    completedDays,
    streakCount,
    xpEarned: completedDays * 15,
    weekCompletion: Math.round((completedDays / 7) * 100)
  }
}

/**
 * Generate motivational message based on progress
 */
export function generateMotivationalMessage(stats: WeeklyStats): string {
  const { completedDays, streakCount, weekCompletion } = stats
  
  if (completedDays === 7) {
    return "Perfect week! You're unstoppable! 🎉"
  } else if (completedDays >= 5) {
    return "Outstanding effort this week! 🏆"
  } else if (streakCount >= 3) {
    return `Amazing ${streakCount}-day streak! Keep it up! 🔥`
  } else if (completedDays >= 2) {
    return "Great progress! You're building momentum! 💪"
  } else if (completedDays === 1) {
    return "Good start! Every journey begins with a single step! 🌟"
  } else {
    return "Ready to start your fitness journey? Let's go! 🚀"
  }
}

/**
 * Get relevant achievements based on current stats
 */
export function getRelevantAchievements(stats: WeeklyStats): string[] {
  const { completedDays, streakCount } = stats
  const achievements = []
  
  if (completedDays >= 1) achievements.push("First workout completed! 💪")
  if (streakCount >= 3) achievements.push("3-day streak achieved! 🔥")
  if (completedDays >= 5) achievements.push("Week warrior - 5 days done! 🏆")
  if (completedDays === 7) achievements.push("Perfect week completed! 🎉")
  
  return achievements
}

/**
 * Generate complete weekly progress data
 */
export function generateCompleteWeeklyProgress(): WeeklyProgressData {
  const weekDays = generateWeeklyProgress()
  const stats = calculateWeeklyStats(weekDays)
  const motivationalMessage = generateMotivationalMessage(stats)
  const achievements = getRelevantAchievements(stats)
  
  return {
    weekDays,
    stats,
    motivationalMessage,
    achievements
  }
}

// Export processed data
export const weeklyProgressData = generateCompleteWeeklyProgress()
