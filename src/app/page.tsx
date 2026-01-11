'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function HomePage() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Mock data - in real app, this would come from your backend
  const todaysWorkout = {
    name: "Upper Body Focus",
    completed: false,
    exercises: [
      {
        name: "TRX Row",
        lastSession: { sets: 3, reps: 8, tempo: "21X1" },
        nextGoal: { sets: 3, reps: 10, tempo: "21X1" },
        completed: false
      },
      {
        name: "Incline Push-up",
        lastSession: { sets: 3, reps: 6, tempo: "3111" },
        nextGoal: { sets: 3, reps: 8, tempo: "3111" },
        completed: false
      },
      {
        name: "Glute Bridge",
        lastSession: { sets: 3, reps: 12, tempo: "2121" },
        nextGoal: { sets: 3, reps: 15, tempo: "2121" },
        completed: false
      }
    ]
  }

  const weekProgress = [
    { day: "Mon", date: "6", completed: true, streak: true },
    { day: "Tue", date: "7", completed: true, streak: true },
    { day: "Wed", date: "8", completed: false, streak: false },
    { day: "Thu", date: "9", completed: true, streak: false },
    { day: "Fri", date: "10", completed: false, streak: false, isToday: true },
    { day: "Sat", date: "11", completed: false, streak: false },
    { day: "Sun", date: "12", completed: false, streak: false }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-fitness-500 bg-clip-text text-transparent">
                CalisthenIQ
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="px-3 py-1 bg-success-500 hover:bg-success-600">
                3-day streak 🔥
              </Badge>
              <div className="text-sm text-muted-foreground">
                Level 2 • 245 XP
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Ready for today's upper body workout?</p>
        </div>

        {/* Today's Workout */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-fitness-600">Today's Workout</CardTitle>
              <CardDescription>{todaysWorkout.name} • 25 minutes</CardDescription>
            </div>
            <Button variant="fitness" size="lg">
              Start Workout
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysWorkout.exercises.map((exercise, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{exercise.name}</h3>
                  </div>
                  <Badge variant="outline" className={exercise.completed ? "bg-success-50 text-success-700 border-success-200" : ""}>
                    {exercise.completed ? "✓ Complete" : "Pending"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground font-medium">Previous Session</div>
                    <div className="bg-secondary/50 border border-border p-2 rounded">
                      <div className="text-foreground">{exercise.lastSession.sets} sets × {exercise.lastSession.reps} reps</div>
                      <div className="text-xs text-muted-foreground">Tempo: {exercise.lastSession.tempo}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-primary font-medium">Today's Goal</div>
                    <div className="bg-primary/10 border border-primary/20 p-2 rounded">
                      <div className="text-primary">{exercise.nextGoal.sets} sets × {exercise.nextGoal.reps} reps</div>
                      <div className="text-xs text-primary/70">Tempo: {exercise.nextGoal.tempo}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Progress Calendar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>This Week's Progress</CardTitle>
            <CardDescription>Track your consistency and build those streaks! 🔥</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekProgress.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium border-2 mx-auto
                      ${day.isToday 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : day.completed 
                          ? day.streak 
                            ? 'border-success-500 bg-success-500 text-white' 
                            : 'border-success-300 bg-success-500/20 text-success-300'
                          : 'border-border bg-secondary/20 text-muted-foreground'
                      }
                    `}
                  >
                    {day.completed && !day.isToday ? '✓' : day.date}
                  </div>
                  {day.streak && day.completed && (
                    <div className="text-xs mt-1">�</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <Badge variant="default" className="px-3 py-1 bg-success-500/20 text-success-300 border-success-500/30">
                4/7 workouts this week
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-sm text-muted-foreground">Total Workouts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-success-400">3</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-energy-400">245</div>
              <div className="text-sm text-muted-foreground">Total XP</div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        size="icon"
      >
        💬
      </Button>

      {/* Chat Popup */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-end p-6 z-50">
          <div className="bg-card border border-border rounded-lg shadow-2xl w-96 h-96 flex flex-col">
            {/* Chat Header */}
            <div className="border-b border-border p-4 flex justify-between items-center bg-primary text-primary-foreground rounded-t-lg">
              <div>
                <h3 className="font-semibold">CalisthenIQ Coach</h3>
                <p className="text-xs text-primary-foreground/80">Your AI fitness coach</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
                onClick={() => setIsChatOpen(false)}
              >
                ×
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="coaching-bubble">
                <p className="text-sm">
                  Hi! I'm ready to help you with:
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <div>• 📝 Quick intake questions</div>
                  <div>• ⚠️ Safety & risk assessment</div>
                  <div>• 📈 Progress updates & logging</div>
                  <div>• 💡 Exercise modifications</div>
                </div>
              </div>
              
              <div className="coaching-bubble">
                <p className="text-sm">
                  What would you like to work on today?
                </p>
              </div>
            </div>

            {/* Chat Input */}
            <div className="border-t border-border p-3">
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" className="text-xs">
                  Log Progress
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Safety Check
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Modify Workout
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything..."
                  className="text-sm"
                />
                <Button className="px-3 bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
