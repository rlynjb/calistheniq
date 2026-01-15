// WeeklyProgress Mock Data
// Raw data types and mock data for weekly progress tracking

export interface WeekDay {
  date: Date
  day: string
  dayNum: number
  completed: boolean
  isToday: boolean
}

export interface WeeklyStats {
  completedDays: number
  streakCount: number
  xpEarned: number
  weekCompletion: number // percentage
}

export interface WeeklyProgressData {
  weekDays: WeekDay[]
  stats: WeeklyStats
  motivationalMessage: string
  achievements: string[]
}

// Mock weekly progress data - simulates a realistic workout week
const mockWeeklyProgressData: WeeklyProgressData = {
  weekDays: [], // Will be generated dynamically
  stats: {
    completedDays: 0, // Will be calculated
    streakCount: 0, // Will be calculated
    xpEarned: 0, // Will be calculated
    weekCompletion: 0 // Will be calculated
  },
  motivationalMessage: "",
  achievements: [
    "First workout completed! 💪",
    "3-day streak achieved! 🔥", 
    "Week warrior - 5 days done! 🏆",
    "Perfect week completed! 🎉"
  ]
}

export { mockWeeklyProgressData }
