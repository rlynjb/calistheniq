import type { WorkoutSession } from './types'

// Sample workout sessions for mock data - hardcoded for week of Feb 2-8, 2026
const MOCK_weeklyWorkouts: WorkoutSession[] = [
  {
    exercises: [
      {
        name: "Wall Push-ups with Band Resistance",
        sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }],
        tempo: "3-2-3-1",
        rest: 90,
        equipment: "Mini band"
      },
      {
        name: "Seated Chest Press with Band",
        sets: [{ reps: 6 }, { reps: 5 }, { reps: 4 }],
        tempo: "3-1-3-1",
        rest: 90,
        equipment: "Resistance band"
      }
    ],
    duration: 25,
    categories: ['Push'],
    level: 0,
    date: new Date("2026-02-03T09:30:00.000Z") // Monday, Feb 3, 2026 - 9:30 AM
  },
  {
    exercises: [
      {
        name: "Incline Push-ups",
        sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }],
        tempo: "3-2-3-1",
        rest: 90,
        equipment: "Elevated surface"
      },
      {
        name: "Assisted Pull-ups with Band",
        sets: [{ reps: 3 }, { reps: 2 }, { reps: 2 }],
        tempo: "3-2-3-1",
        rest: 120,
        equipment: "Pull-up bar, resistance band"
      }
    ],
    duration: 30,
    categories: ['Push', 'Pull'],
    level: 1,
    date: new Date("2026-02-04T07:00:00.000Z") // Tuesday, Feb 4, 2026 - 7:00 AM
  },
  {
    exercises: [
      {
        name: "Knee Push-ups",
        sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }],
        tempo: "3-2-3-1",
        rest: 90,
        equipment: "None"
      },
      {
        name: "Wall Sit",
        sets: [{ duration: 30 }, { duration: 25 }, { duration: 20 }],
        rest: 90,
        equipment: "Wall"
      }
    ],
    duration: 20,
    categories: ['Push', 'Squat'],
    level: 0,
    date: new Date("2026-02-06T10:15:00.000Z") // Thursday, Feb 6, 2026 - 10:15 AM
  },
  {
    exercises: [
      {
        name: "Standard Push-ups",
        sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }],
        tempo: "3-2-3-1",
        rest: 90,
        equipment: "None"
      },
      {
        name: "Bodyweight Squats",
        sets: [{ reps: 15 }, { reps: 12 }, { reps: 10 }],
        tempo: "3-2-3-1",
        rest: 90,
        equipment: "None"
      },
      {
        name: "Pike Push-ups",
        sets: [{ reps: 6 }, { reps: 5 }, { reps: 4 }],
        tempo: "3-2-3-1",
        rest: 90,
        equipment: "None"
      }
    ],
    duration: 35,
    categories: ['Push', 'Squat'],
    level: 1,
    date: new Date("2026-02-07T08:45:00.000Z") // Friday, Feb 7, 2026 - 8:45 AM
  }
]

// Today's planned workout - Sunday, Feb 2, 2026
const todaysTodayWorkout: WorkoutSession = {
  exercises: [
    {
      name: "Incline Push-ups",
      sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }],
      tempo: "3-2-3-1",
      rest: 90,
      equipment: "Elevated surface",
      notes: "Focus on controlled movement"
    },
    {
      name: "Assisted Squats",
      sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }],
      tempo: "3-2-3-1",
      rest: 90,
      equipment: "TRX or resistance band",
      notes: "Maintain proper form"
    },
    {
      name: "Wall Handstand Hold",
      sets: [{ duration: 15 }, { duration: 12 }, { duration: 10 }],
      rest: 120,
      equipment: "Wall",
      notes: "Build up shoulder strength"
    }
  ],
  duration: 30,
  categories: ['Push', 'Squat'],
  level: 1,
  date: new Date("2026-02-02T18:00:00.000Z") // Sunday, Feb 2, 2026 - 6:00 PM
}

export { MOCK_weeklyWorkouts, todaysTodayWorkout }
