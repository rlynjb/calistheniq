// WeeklyProgress Normalization Functions
// Business logic for processing weekly progress data

import { WeekDay, WeeklyStats, WeeklyProgressData, mockWeeklyProgressData, sampleWorkouts, todaysPlannedWorkout, WorkoutSession } from './mock'

/**
 * Generate weekly progress data for the current week (Sunday to Saturday)
 * Creates deterministic completion pattern to avoid hydration mismatch
 * Now includes workout session data for completed and planned workouts
 */
export function generateWeeklyProgress(): WeekDay[] {
  const today = new Date()
  const weekDays: WeekDay[] = []
  
  // Get the start of the current week (Sunday)
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - currentDay)
  
  // Generate all 7 days of the week (Sunday to Saturday)
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    
    // Check if this date is today
    const isToday = date.toDateString() === today.toDateString()
    
    // Check if this date is in the past (for completion logic)
    const isPast = date < today
    
    // Deterministic completion based on date (to avoid hydration mismatch)
    // Use day of month to create consistent pattern, but only for past days
    const dayNum = date.getDate()
    const completed = isPast && (dayNum % 3 !== 0) // Pattern based on date, only for past days
    
    // Assign workout sessions based on day pattern
    let workoutSession: WorkoutSession | undefined
    let plannedWorkout: WorkoutSession | undefined
    
    if (completed) {
      // Assign a workout session based on the day index to create variety
      const workoutIndex = i % sampleWorkouts.length
      workoutSession = sampleWorkouts[workoutIndex]
    }
    
    if (isToday) {
      // Today gets the planned workout
      plannedWorkout = todaysPlannedWorkout
    }
    
    weekDays.push({
      date,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: dayNum,
      completed,
      isToday,
      workoutSession,
      plannedWorkout
    })
  }
  
  return weekDays
}

/**
 * Calculate weekly statistics from week days data
 */
export function calculateWeeklyStats(weekDays: WeekDay[]): WeeklyStats {
  const completedDays = weekDays.filter(day => day.completed).length
  
  // Calculate current streak (counting backwards from today or most recent completed day)
  const today = new Date()
  let streakCount = 0
  
  // Find today's index in the week
  const todayIndex = weekDays.findIndex(day => day.isToday)
  
  if (todayIndex !== -1) {
    // Count backwards from today to find current streak
    for (let i = todayIndex - 1; i >= 0; i--) {
      if (weekDays[i].completed) {
        streakCount++
      } else {
        break
      }
    }
  } else {
    // If today is not in this week, count from the end
    for (let i = weekDays.length - 1; i >= 0; i--) {
      if (weekDays[i].completed) {
        streakCount++
      } else {
        break
      }
    }
  }
  
  // Calculate total exercises and XP from completed workouts
  let totalExercises = 0
  let totalXp = 0
  const categoryCount = { Push: 0, Pull: 0, Squat: 0 }
  
  weekDays.forEach(day => {
    if (day.workoutSession) {
      totalExercises += day.workoutSession.exercises.length
      totalXp += day.workoutSession.xpEarned
      
      // Count categories
      day.workoutSession.categories.forEach(cat => {
        categoryCount[cat]++
      })
    }
  })
  
  // Determine favorite category
  const favoriteCategory = Object.entries(categoryCount).reduce((a, b) => 
    categoryCount[a[0] as keyof typeof categoryCount] > categoryCount[b[0] as keyof typeof categoryCount] ? a : b
  )[0] as 'Push' | 'Pull' | 'Squat'
  
  // If no clear favorite or tied, use 'Mixed'
  const maxCount = Math.max(...Object.values(categoryCount))
  const categoriesWithMaxCount = Object.values(categoryCount).filter(count => count === maxCount).length
  const finalFavoriteCategory = categoriesWithMaxCount > 1 || maxCount === 0 ? 'Mixed' : favoriteCategory
  
  return {
    completedDays,
    streakCount,
    xpEarned: totalXp,
    weekCompletion: Math.round((completedDays / 7) * 100),
    totalExercises,
    favoriteCategory: finalFavoriteCategory as 'Push' | 'Pull' | 'Squat' | 'Mixed'
  }
}

/**
 * Generate motivational message based on progress
 */
export function generateMotivationalMessage(stats: WeeklyStats): string {
  const { completedDays, streakCount, weekCompletion, totalExercises } = stats
  
  if (completedDays === 7) {
    return `Perfect week! You completed ${totalExercises} exercises! 🎉`
  } else if (completedDays >= 5) {
    return `Outstanding effort! ${totalExercises} exercises this week! 🏆`
  } else if (streakCount >= 3) {
    return `Amazing ${streakCount}-day streak with ${totalExercises} exercises! 🔥`
  } else if (completedDays >= 2) {
    return `Great progress! ${totalExercises} exercises completed so far! 💪`
  } else if (completedDays === 1) {
    return `Good start! Keep building on those ${totalExercises} exercises! 🌟`
  } else {
    return "Ready to start your fitness journey? Let's go! 🚀"
  }
}

/**
 * Get relevant achievements based on current stats
 */
export function getRelevantAchievements(stats: WeeklyStats): string[] {
  const { completedDays, streakCount, totalExercises, favoriteCategory } = stats
  const achievements = []
  
  if (completedDays >= 1) achievements.push("First workout completed! 💪")
  if (streakCount >= 3) achievements.push("3-day streak achieved! 🔥")
  if (completedDays >= 5) achievements.push("Week warrior - 5 days done! 🏆")
  if (completedDays === 7) achievements.push("Perfect week completed! 🎉")
  if (totalExercises >= 15) achievements.push(`Exercise master - ${totalExercises} exercises! 🎯`)
  if (favoriteCategory !== 'Mixed') achievements.push(`${favoriteCategory} specialist! 💯`)
  
  return achievements
}

/**
 * Get today's workout preview
 */
export function getTodaysWorkoutPreview(weekDays: WeekDay[]): string[] {
  const today = weekDays.find(day => day.isToday)
  if (!today?.plannedWorkout) return []
  
  return today.plannedWorkout.exercises.map(exercise => 
    `${exercise.name} (${exercise.sets.length} sets)`
  )
}

/**
 * Get recent workout summary
 */
export function getRecentWorkoutSummary(weekDays: WeekDay[]): string[] {
  const completedWorkouts = weekDays
    .filter(day => day.workoutSession)
    .slice(-2) // Get last 2 completed workouts
  
  return completedWorkouts.map(day => {
    const session = day.workoutSession!
    const exerciseCount = session.exercises.length
    const categories = session.categories.join(', ')
    return `${day.day}: ${exerciseCount} exercises (${categories}) - ${session.duration}min`
  })
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
