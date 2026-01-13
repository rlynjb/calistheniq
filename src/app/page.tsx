'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ChatInterface from '@/components/chat/ChatInterface'

// Mock data for exercise history and current workout
const mockLastWorkout = {
  date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  duration: 18,
  exercises: [
    {
      name: "Push-ups",
      sets: [
        { reps: 8, tempo: "2-1-2-1", rest: 60, completed: true },
        { reps: 6, tempo: "2-1-2-1", rest: 60, completed: true },
        { reps: 5, tempo: "2-1-2-1", rest: 60, completed: true }
      ]
    },
    {
      name: "Pike Push-ups",
      sets: [
        { reps: 5, tempo: "2-1-2-1", rest: 90, completed: true },
        { reps: 4, tempo: "2-1-2-1", rest: 90, completed: true },
        { reps: 3, tempo: "2-1-2-1", rest: 90, completed: false }
      ]
    },
    {
      name: "Plank Hold",
      sets: [
        { duration: 45, tempo: "hold", rest: 60, completed: true },
        { duration: 35, tempo: "hold", rest: 60, completed: true }
      ]
    }
  ]
}

const mockTodaysWorkout = {
  exercises: [
    {
      name: "Push-ups",
      targetSets: [
        { reps: 10, tempo: "2-1-2-1", rest: 60 },
        { reps: 8, tempo: "2-1-2-1", rest: 60 },
        { reps: 6, tempo: "2-1-2-1", rest: 60 }
      ],
      progression: "Increase reps by 2 from last session"
    },
    {
      name: "Pike Push-ups", 
      targetSets: [
        { reps: 6, tempo: "2-1-2-1", rest: 90 },
        { reps: 5, tempo: "2-1-2-1", rest: 90 },
        { reps: 4, tempo: "2-1-2-1", rest: 90 }
      ],
      progression: "Focus on completing all sets"
    },
    {
      name: "Plank Hold",
      targetSets: [
        { duration: 50, tempo: "hold", rest: 60 },
        { duration: 45, tempo: "hold", rest: 60 }
      ],
      progression: "Hold 5 seconds longer than last time"
    }
  ]
}

// Mock data for workout levels - Progressive calisthenics exercises
const workoutLevels = {
  0: {
    name: "Foundation",
    description: "Stability, control, and knee-friendly movements",
    equipment: "Mini band required",
    exercises: {
      Push: [
        { name: "Wall Push-ups with Band Resistance", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }], tempo: "3-2-3-1", rest: 90, equipment: "Mini band around back" },
        { name: "Seated Chest Press (Band)", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "2-1-2-1", rest: 60, equipment: "Mini band" },
        { name: "Standing Band Pull-Apart", sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }], tempo: "2-1-2-1", rest: 45, equipment: "Mini band" }
      ],
      Pull: [
        { name: "Seated Band Rows", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "2-1-2-1", rest: 60, equipment: "Mini band" },
        { name: "Band-Assisted Dead Hang", sets: [{ duration: 15 }, { duration: 12 }, { duration: 10 }], tempo: "hold", rest: 90, equipment: "Mini band for assistance" },
        { name: "Lat Pulldowns (Band)", sets: [{ reps: 6 }, { reps: 5 }, { reps: 4 }], tempo: "2-1-2-1", rest: 75, equipment: "Mini band overhead" }
      ],
      Squat: [
        { name: "Supported Squats (Band)", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "3-2-3-1", rest: 90, equipment: "Mini band for support" },
        { name: "Seated Leg Extensions (Band)", sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }], tempo: "2-1-2-1", rest: 60, equipment: "Mini band around ankles" },
        { name: "Standing Hip Abduction (Band)", sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }], tempo: "2-1-1-1", rest: 45, equipment: "Mini band around ankles" },
        { name: "Glute Bridges (Band)", sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }], tempo: "2-1-2-1", rest: 60, equipment: "Mini band around knees" }
      ]
    }
  },
  1: {
    name: "Beginner",
    exercises: {
      Push: [
        { name: "Wall Push-ups", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "2-1-2-1", rest: 60 },
        { name: "Incline Push-ups", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }], tempo: "2-1-2-1", rest: 60 }
      ],
      Pull: [
        { name: "Dead Hang", sets: [{ duration: 10 }, { duration: 8 }], tempo: "hold", rest: 60 },
        { name: "Inverted Rows (High Bar)", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }], tempo: "2-1-2-1", rest: 90 }
      ],
      Squat: [
        { name: "Chair Assisted Squats", sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }], tempo: "2-1-2-1", rest: 60 },
        { name: "Calf Raises", sets: [{ reps: 15 }, { reps: 12 }, { reps: 10 }], tempo: "2-1-1-1", rest: 45 }
      ]
    }
  },
  2: {
    name: "Novice",
    exercises: {
      Push: [
        { name: "Knee Push-ups", sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }], tempo: "2-1-2-1", rest: 60 },
        { name: "Pike Push-ups", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }], tempo: "2-1-2-1", rest: 90 }
      ],
      Pull: [
        { name: "Dead Hang", sets: [{ duration: 20 }, { duration: 15 }, { duration: 10 }], tempo: "hold", rest: 60 },
        { name: "Inverted Rows", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "2-1-2-1", rest: 90 }
      ],
      Squat: [
        { name: "Bodyweight Squats", sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }], tempo: "2-1-2-1", rest: 60 },
        { name: "Lunges", sets: [{ reps: 6 }, { reps: 5 }, { reps: 4 }], tempo: "2-1-2-1", rest: 60 }
      ]
    }
  },
  3: {
    name: "Intermediate",
    exercises: {
      Push: [
        { name: "Push-ups", sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }], tempo: "2-1-2-1", rest: 60 },
        { name: "Pike Push-ups", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "2-1-2-1", rest: 90 },
        { name: "Diamond Push-ups", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }], tempo: "2-1-2-1", rest: 90 }
      ],
      Pull: [
        { name: "Dead Hang", sets: [{ duration: 30 }, { duration: 25 }, { duration: 20 }], tempo: "hold", rest: 60 },
        { name: "Negative Pull-ups", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }], tempo: "1-1-5-1", rest: 120 },
        { name: "Inverted Rows", sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }], tempo: "2-1-2-1", rest: 90 }
      ],
      Squat: [
        { name: "Bodyweight Squats", sets: [{ reps: 15 }, { reps: 12 }, { reps: 10 }], tempo: "2-1-2-1", rest: 60 },
        { name: "Jump Squats", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "2-1-X-1", rest: 90 },
        { name: "Single Leg Glute Bridges", sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }], tempo: "2-1-2-1", rest: 60 }
      ]
    }
  },
  4: {
    name: "Advanced",
    exercises: {
      Push: [
        { name: "Push-ups", sets: [{ reps: 15 }, { reps: 12 }, { reps: 10 }, { reps: 8 }], tempo: "2-1-2-1", rest: 60 },
        { name: "Handstand Push-ups (Wall)", sets: [{ reps: 3 }, { reps: 2 }, { reps: 2 }], tempo: "2-1-2-1", rest: 120 },
        { name: "Archer Push-ups", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }], tempo: "2-1-2-1", rest: 90 },
        { name: "Dips", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "2-1-2-1", rest: 90 }
      ],
      Pull: [
        { name: "Pull-ups", sets: [{ reps: 6 }, { reps: 5 }, { reps: 4 }], tempo: "2-1-2-1", rest: 120 },
        { name: "Chin-ups", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "2-1-2-1", rest: 120 },
        { name: "L-Hang", sets: [{ duration: 15 }, { duration: 12 }, { duration: 10 }], tempo: "hold", rest: 90 }
      ],
      Squat: [
        { name: "Pistol Squat Progression", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }], tempo: "2-1-2-1", rest: 90 },
        { name: "Bulgarian Split Squats", sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }], tempo: "2-1-2-1", rest: 75 },
        { name: "Single Leg Calf Raises", sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }], tempo: "2-1-1-1", rest: 60 }
      ]
    }
  },
  5: {
    name: "Expert",
    exercises: {
      Push: [
        { name: "One Arm Push-up Progression", sets: [{ reps: 3 }, { reps: 2 }, { reps: 2 }], tempo: "2-1-2-1", rest: 150 },
        { name: "Handstand Push-ups", sets: [{ reps: 6 }, { reps: 5 }, { reps: 4 }], tempo: "2-1-2-1", rest: 120 },
        { name: "Planche Push-ups", sets: [{ reps: 3 }, { reps: 2 }, { reps: 2 }], tempo: "2-1-2-1", rest: 150 },
        { name: "Ring Dips", sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }], tempo: "2-1-2-1", rest: 90 }
      ],
      Pull: [
        { name: "Pull-ups", sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }, { reps: 6 }], tempo: "2-1-2-1", rest: 120 },
        { name: "Muscle-ups", sets: [{ reps: 3 }, { reps: 2 }, { reps: 2 }], tempo: "2-1-2-1", rest: 180 },
        { name: "Front Lever Progression", sets: [{ duration: 10 }, { duration: 8 }, { duration: 6 }], tempo: "hold", rest: 120 },
        { name: "Archer Pull-ups", sets: [{ reps: 4 }, { reps: 3 }, { reps: 2 }], tempo: "2-1-2-1", rest: 150 }
      ],
      Squat: [
        { name: "Pistol Squats", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }], tempo: "2-1-2-1", rest: 90 },
        { name: "Shrimp Squats", sets: [{ reps: 3 }, { reps: 2 }, { reps: 2 }], tempo: "2-1-2-1", rest: 120 },
        { name: "Jump Lunges", sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }], tempo: "2-1-X-1", rest: 75 }
      ]
    }
  }
}

// Mock data for current user levels per category
const currentUserLevels = {
  Push: 1,
  Pull: 1,
  Squat: 0
}

const generateWeeklyProgress = () => {
  const today = new Date()
  const weekDays = []
  
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

function ExerciseHistory() {
  const [showHistory, setShowHistory] = useState(true)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">💪 Exercise Progress</CardTitle>
        </div>
        <div className="flex items-center gap-1 w-full">
          <button
            onClick={() => setShowHistory(true)}
            className={`flex-1 px-2 py-1 rounded-md text-xs transition-all ${
              showHistory 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Last Session
          </button>
          <button
            onClick={() => setShowHistory(false)}
            className={`flex-1 px-2 py-1 rounded-md text-xs transition-all ${
              !showHistory 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Today's Plan
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showHistory ? (
          /* Last Workout - Compact Version */
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {mockLastWorkout.date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              })} • {mockLastWorkout.duration} min
            </div>
            {mockLastWorkout.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{exercise.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Set {setIndex + 1}</span>
                      <div className="flex items-center gap-2">
                        <span>
                          {'reps' in set ? `${set.reps}` : `${set.duration}s`}
                        </span>
                        {set.completed ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 border border-orange-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Today's Workout - Compact Version */
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Today's targets based on last session
            </div>
            {mockTodaysWorkout.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{exercise.name}</h4>
                  <Badge className="text-xs bg-blue-100 text-blue-800">
                    {exercise.targetSets.length} sets
                  </Badge>
                </div>
                
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <div className="text-blue-800">{exercise.progression}</div>
                </div>

                <div className="space-y-1">
                  {exercise.targetSets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Set {setIndex + 1}</span>
                      <div className="flex items-center gap-2">
                        <span>
                          {'reps' in set ? `${set.reps}` : `${set.duration}s`}
                        </span>
                        <div className="w-2 h-2 border border-yellow-300 rounded-full bg-yellow-50"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-green-600">💡</div>
                <div className="text-sm font-medium text-green-800">Ready to start?</div>
              </div>
              <p className="text-xs text-green-700">
                Chat with your AI coach to begin today's session!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConsolidatedProgress() {
  const [activeTab, setActiveTab] = useState('progress')
  const [weekDays, setWeekDays] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setWeekDays(generateWeeklyProgress())
  }, [])

  const completedDays = weekDays.filter(day => day.completed).length
  const reversedWeekDays = [...weekDays].reverse()
  const currentStreak = reversedWeekDays.findIndex(day => !day.completed)
  const streakCount = currentStreak === -1 ? weekDays.length - 1 : currentStreak

  const tabs = [
    { id: 'progress', label: '📅 Weekly Progress' },
    { id: 'workout', label: '� Workout Progress' },
    { id: 'current', label: '🎯 Current Level' },
    { id: 'levels', label: '🏆 Workout Levels' }
  ]

  return (
    <Card className="mb-6">
      <CardHeader>
        {/* Tab Navigation */}
        <div className="flex items-center justify-center border-b">
          <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Weekly Progress Tab */}
        {activeTab === 'progress' && (
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
                  {reversedWeekDays.map((day, index) => (
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
                      🔥 {streakCount} day streak
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      💪 {completedDays * 15} XP earned
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {completedDays === 7 
                      ? "Perfect week! 🎉" 
                      : `${7 - completedDays} more to complete the week`
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workout Progress Tab - Combined Last Session & Today's Plan */}
        {activeTab === 'workout' && (
          <div>
            <div className="text-sm text-muted-foreground mb-4">
              Your workout progress: last session results and today's targets
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {/* Last Session Column */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    📋 Last Session
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {mockLastWorkout.date.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric' 
                    })} • {mockLastWorkout.duration} min
                  </div>
                </div>
                
                <div className="space-y-3">
                  {mockLastWorkout.exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="bg-secondary/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{exercise.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        {/* Sets, Tempo, and Rest in one line */}
                        <div className="text-xs">
                          <span className="text-muted-foreground">{exercise.sets.length} Sets: </span>
                          <span className="font-medium">
                            {exercise.sets.map((set, index) => {
                              const value = 'reps' in set ? set.reps : `${set.duration}s`
                              return set.completed ? `${value}✓` : `${value}✗`
                            }).join(' → ')}
                          </span>
                        </div>
                        
                        <div className="text-xs">
                          <span className="text-muted-foreground">Tempo: </span>
                          <span className="font-medium">{exercise.sets[0].tempo}</span>
                          <span className="text-muted-foreground ml-3">Rest: </span>
                          <span className="font-medium">{exercise.sets[0].rest}s</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Plan Column */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    🎯 Today's Plan
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Based on your progress
                  </div>
                </div>
                
                <div className="space-y-3">
                  {mockTodaysWorkout.exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="bg-blue-50/50 rounded-lg p-3">
                      <div className="mb-2">
                        <h4 className="font-medium text-sm">{exercise.name}</h4>
                      </div>
                      
                      <div className="space-y-1">
                        {/* Sets, Tempo, and Rest in one line */}
                        <div className="text-xs">
                          <span className="text-muted-foreground">{exercise.targetSets.length} Sets: </span>
                          <span className="font-medium">
                            {exercise.targetSets.map((set, index) => 
                              'reps' in set ? set.reps : `${set.duration}s`
                            ).join(' → ')}
                          </span>
                        </div>
                        
                        <div className="text-xs">
                          <span className="text-muted-foreground">Tempo: </span>
                          <span className="font-medium">{exercise.targetSets[0].tempo}</span>
                          <span className="text-muted-foreground ml-3">Rest: </span>
                          <span className="font-medium">{exercise.targetSets[0].rest}s</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 p-2 bg-blue-100/50 rounded text-xs">
                        <div className="text-xs text-blue-600 font-medium mb-1">PROGRESSION NOTE</div>
                        <div className="text-blue-800">{exercise.progression}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Progress Comparison */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-blue-600">📈</div>
                <h3 className="font-semibold text-lg">Progress Comparison</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockTodaysWorkout.exercises.map((todayExercise, index) => {
                  const lastExercise = mockLastWorkout.exercises.find(ex => ex.name === todayExercise.name)
                  if (!lastExercise) return null
                  
                  const lastTotal = lastExercise.sets.reduce((sum, set) => {
                    return sum + ('reps' in set ? set.reps : set.duration)
                  }, 0)
                  
                  const todayTotal = todayExercise.targetSets.reduce((sum, set) => {
                    return sum + ('reps' in set ? set.reps : set.duration)
                  }, 0)
                  
                  const improvement = todayTotal - lastTotal
                  const improvementPercent = Math.round((improvement / lastTotal) * 100)
                  
                  return (
                    <div key={index} className="bg-white/50 rounded p-3">
                      <div className="text-sm font-medium mb-2">{todayExercise.name}</div>
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Last: </span>
                          <span className="font-medium">{lastTotal}</span>
                          <span className="text-muted-foreground ml-2">Target: </span>
                          <span className="font-medium">{todayTotal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {improvement > 0 ? (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                              +{improvement} ({improvementPercent > 0 ? `+${improvementPercent}` : improvementPercent}%)
                            </Badge>
                          ) : improvement < 0 ? (
                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                              {improvement} ({improvementPercent}%)
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Maintain
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Workout Tips */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-green-600">💡</div>
                <div className="text-sm font-medium text-green-800">Today's Workout Tips</div>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <p>• Focus on completing all planned sets with proper form</p>
                <p>• If you can't hit the target reps, maintain good form and do what you can</p>
                <p>• Rest adequately between sets - don't rush the workout</p>
                <p>• Chat with your AI coach if you need form guidance or modifications</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Level Tab */}
        {activeTab === 'current' && (
          <div>
            <div className="text-sm text-muted-foreground mb-4">
              Your current level progress across movement categories
            </div>
            
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {Object.entries(currentUserLevels).map(([category, level]) => {
                const levelInfo = workoutLevels[level as keyof typeof workoutLevels]
                const nextLevel = workoutLevels[(level + 1) as keyof typeof workoutLevels]
                
                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{category}</h3>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        Level {level}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Current: </span>
                        <span className="font-medium">{levelInfo.name}</span>
                      </div>
                      
                      {(levelInfo as any).description && (
                        <p className="text-xs text-muted-foreground">{(levelInfo as any).description}</p>
                      )}
                      
                      {(levelInfo as any).equipment && (
                        <Badge variant="secondary" className="text-xs">
                          📦 {(levelInfo as any).equipment}
                        </Badge>
                      )}
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Current Exercises:</h4>
                        {levelInfo.exercises[category as keyof typeof levelInfo.exercises]?.map((exercise: any, index: number) => (
                          <div key={index} className="bg-secondary/30 rounded p-2">
                            <div className="text-sm font-medium">{exercise.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {exercise.sets.length} Sets: {exercise.sets.map((set: any) => 
                                'reps' in set ? set.reps : `${set.duration}s`
                              ).join(' → ')}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {nextLevel && (
                        <div className="pt-2 border-t">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Next: </span>
                            <span className="font-medium text-blue-600">Level {level + 1} - {nextLevel.name}</span>
                          </div>
                        </div>
                      )}
                      
                      {!nextLevel && (
                        <div className="pt-2 border-t">
                          <Badge variant="default" className="text-xs bg-gold text-gold-foreground">
                            🏆 Max Level Achieved
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Progress Summary */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-blue-600">📊</div>
                <h3 className="font-semibold text-lg">Progress Summary</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Overall Level: </span>
                    <span className="font-medium">
                      {Math.round((currentUserLevels.Push + currentUserLevels.Pull + currentUserLevels.Squat) / 3 * 10) / 10}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground">Strongest Area: </span>
                    <span className="font-medium text-green-600">
                      {Object.entries(currentUserLevels).reduce((a, b) => currentUserLevels[a[0] as keyof typeof currentUserLevels] > currentUserLevels[b[0] as keyof typeof currentUserLevels] ? a : b)[0]}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground">Focus Area: </span>
                    <span className="font-medium text-orange-600">
                      {Object.entries(currentUserLevels).reduce((a, b) => currentUserLevels[a[0] as keyof typeof currentUserLevels] < currentUserLevels[b[0] as keyof typeof currentUserLevels] ? a : b)[0]}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total Progression: </span>
                    <span className="font-medium">
                      {Math.round((currentUserLevels.Push + currentUserLevels.Pull + currentUserLevels.Squat) / 15 * 100)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentUserLevels.Push + currentUserLevels.Pull + currentUserLevels.Squat) / 15 * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Progress to mastery (Level 5 in all categories)
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-green-600">💡</div>
                <div className="text-sm font-medium text-green-800">Personalized Recommendations</div>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                {currentUserLevels.Squat === 0 && (
                  <p>• Start with Level 0 Squat exercises focusing on stability and mini band assistance</p>
                )}
                {Math.min(...Object.values(currentUserLevels)) < Math.max(...Object.values(currentUserLevels)) && (
                  <p>• Focus on balancing your weakest area ({Object.entries(currentUserLevels).reduce((a, b) => currentUserLevels[a[0] as keyof typeof currentUserLevels] < currentUserLevels[b[0] as keyof typeof currentUserLevels] ? a : b)[0]}) to improve overall strength</p>
                )}
                <p>• Master your current level exercises before advancing to prevent injury</p>
                <p>• Consider working with your AI coach to create a balanced progression plan</p>
              </div>
            </div>
          </div>
        )}

        {/* Workout Levels Tab */}
        {activeTab === 'levels' && (
          <div>
            <div className="text-sm text-muted-foreground mb-4">
              Progressive calisthenics exercises organized by difficulty levels
            </div>
            
            <div className="space-y-6">
              {Object.entries(workoutLevels).map(([levelNum, level]) => (
                <div key={levelNum} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      Level {levelNum}
                    </Badge>
                    <h3 className="text-lg font-semibold">{level.name}</h3>
                  </div>
                  
                  {(level as any).description && (
                    <p className="text-sm text-muted-foreground mb-2">{(level as any).description}</p>
                  )}
                  
                  {(level as any).equipment && (
                    <div className="mb-4">
                      <Badge variant="secondary" className="text-xs">
                        📦 {(level as any).equipment}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    {Object.entries(level.exercises).map(([category, exercises]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          {category}
                        </h4>
                        
                        <div className="space-y-3">
                          {exercises.map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className="bg-secondary/30 rounded-md p-3">
                              <h5 className="font-medium text-sm mb-2">{exercise.name}</h5>
                              
                              {(exercise as any).equipment && (
                                <div className="mb-2">
                                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                    {(exercise as any).equipment}
                                  </Badge>
                                </div>
                              )}
                              
                              <div className="space-y-1">
                                {/* Sets, Tempo, and Rest in one line */}
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{exercise.sets.length} Sets: </span>
                                  <span className="font-medium">
                                    {exercise.sets.map((set, index) => 
                                      'reps' in set ? set.reps : `${set.duration}s`
                                    ).join(' → ')}
                                  </span>
                                </div>
                                
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Tempo: </span>
                                  <span className="font-medium">{exercise.tempo}</span>
                                  <span className="text-muted-foreground ml-3">Rest: </span>
                                  <span className="font-medium">{exercise.rest}s</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Level Guidelines */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-blue-600">💡</div>
                <div className="text-sm font-medium text-blue-800">Progression Guidelines</div>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>Level 0 (Foundation):</strong> Focus on stability, control, and knee-friendly movements with mini band assistance</p>
                <p>• Complete all exercises in your current level with proper form before advancing</p>
                <p>• Master at least 80% of the target reps/duration for each exercise</p>
                <p>• Focus on quality over quantity - perfect form is essential</p>
                <p>• Rest adequately between workouts (48-72 hours for same muscle groups)</p>
                <p>• If experiencing knee discomfort, start with Level 0 and progress slowly</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Consolidated Progress */}
      <ConsolidatedProgress />

      {/* Chat Interface */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px]">
            <ChatInterface />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
