'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import WorkoutCard from '@/components/workout/WorkoutCard'
import { useWorkout, WorkoutPlan } from '@/hooks/useWorkout'

// Mock workout plan - in real app this would come from chat context or API
const mockWorkoutPlan: WorkoutPlan = {
  id: 'mock_workout_1',
  title: 'Full Body Beginner Strength',
  description: '25-minute full-body beginner workout - Focus on form and controlled movement',
  duration: 25,
  difficulty: 'beginner',
  type: 'strength',
  equipment: ['bodyweight', 'trx'],
  exercises: [
    {
      name: 'Ankle Rocks',
      sets: 1,
      reps: '45 seconds each direction',
      difficulty: 'beginner',
      notes: 'Gentle mobility warm-up for ankles'
    },
    {
      name: 'Hip Flexor Stretch',
      sets: 1,
      reps: '30 seconds each side',
      difficulty: 'beginner',
      notes: 'Hold gently, focus on opening hip flexors'
    },
    {
      name: 'Incline Push-ups',
      sets: 3,
      reps: '8-12',
      difficulty: 'beginner',
      notes: 'Use a stable elevated surface, focus on controlled movement'
    },
    {
      name: 'TRX Rows',
      sets: 3,
      reps: '8-10',
      difficulty: 'beginner',
      notes: 'Keep body straight, squeeze shoulder blades together'
    },
    {
      name: 'Glute Bridges',
      sets: 3,
      reps: '12-15',
      difficulty: 'beginner',
      notes: 'Squeeze glutes at the top, pause for 1 second'
    },
    {
      name: 'Dead Bug',
      sets: 3,
      reps: '5 each side',
      difficulty: 'beginner',
      notes: 'Keep lower back pressed into floor, move slowly'
    }
  ],
  created: new Date()
}

export default function WorkoutPage() {
  const { currentPlan, createWorkoutFromChatResponse } = useWorkout()
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null)
  
  useEffect(() => {
    // Use current plan from chat if available, otherwise use mock
    setSelectedPlan(currentPlan || mockWorkoutPlan)
  }, [currentPlan])

  const handleBackToPlanning = () => {
    // In real app, this would navigate back to chat or planning
    window.location.href = '/chat'
  }

  if (!selectedPlan) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🤸‍♂️</div>
          <h1 className="text-2xl font-bold mb-2">No Workout Plan Available</h1>
          <p className="text-muted-foreground mb-6">
            Start a conversation with your AI coach to create a personalized workout plan.
          </p>
          <Button onClick={handleBackToPlanning}>
            Talk to Coach
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Workout Plan</h1>
            <p className="text-muted-foreground">
              Ready to build strength safely with your personalized routine
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToPlanning}>
            Back to Coach
          </Button>
        </div>
      </div>

      <WorkoutCard 
        plan={selectedPlan} 
        showStartButton={true}
        onStartWorkout={() => console.log('Workout started!')}
      />
    </div>
  )
}
