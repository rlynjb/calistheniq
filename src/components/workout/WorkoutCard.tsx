'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkout, WorkoutPlan, Exercise } from '@/hooks/useWorkout'

interface ExerciseItemProps {
  exercise: Exercise
  isCompleted: boolean
  isCurrent: boolean
  onComplete: (exerciseName: string, notes?: string) => void
}

function ExerciseItem({ exercise, isCompleted, isCurrent, onComplete }: ExerciseItemProps) {
  const handleComplete = () => {
    onComplete(exercise.name)
  }

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      isCompleted 
        ? 'border-green-200 bg-green-50' 
        : isCurrent 
          ? 'border-primary bg-primary/5' 
          : 'border-border bg-card'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{exercise.name}</h4>
            <Badge variant={exercise.difficulty === 'beginner' ? 'secondary' : exercise.difficulty === 'intermediate' ? 'default' : 'destructive'}>
              {exercise.difficulty}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-x-4">
            <span>{exercise.sets} sets</span>
            <span>{exercise.reps} reps</span>
            {exercise.duration && <span>{exercise.duration}</span>}
          </div>
          {exercise.notes && (
            <p className="text-sm text-muted-foreground mt-2">{exercise.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <div className="text-green-600 font-medium">✓ Complete</div>
          ) : isCurrent ? (
            <Button onClick={handleComplete} size="sm">
              Mark Complete
            </Button>
          ) : (
            <div className="text-muted-foreground text-sm">Waiting</div>
          )}
        </div>
      </div>
    </div>
  )
}

interface WorkoutCardProps {
  plan: WorkoutPlan
  showStartButton?: boolean
  onStartWorkout?: () => void
}

export default function WorkoutCard({ plan, showStartButton = false, onStartWorkout }: WorkoutCardProps) {
  const {
    currentSession,
    startWorkoutSession,
    completeExercise,
    finishWorkoutSession,
    getWorkoutProgress,
    getCurrentExercise,
    isWorkoutComplete
  } = useWorkout()

  const progress = getWorkoutProgress()
  const currentExercise = getCurrentExercise()
  const workoutComplete = isWorkoutComplete()

  const handleStartWorkout = () => {
    startWorkoutSession(plan.id)
    onStartWorkout?.()
  }

  const handleCompleteWorkout = () => {
    // Mock XP and streak data - in real app this would come from API
    finishWorkoutSession(25, 3)
  }

  return (
    <div className="space-y-6">
      {/* Workout Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{plan.title}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </div>
            <Badge variant="outline" className="capitalize">
              {plan.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-bold text-primary">{plan.duration}</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{plan.exercises.length}</div>
              <div className="text-sm text-muted-foreground">Exercises</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {currentSession ? `${progress.percentage}%` : '0%'}
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>

          {currentSession && progress.total > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{progress.completed}/{progress.total} exercises</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {plan.equipment.map((item) => (
              <Badge key={item} variant="secondary" className="capitalize">
                {item}
              </Badge>
            ))}
          </div>

          {showStartButton && !currentSession && (
            <div className="mt-4">
              <Button onClick={handleStartWorkout} className="w-full">
                Start Workout
              </Button>
            </div>
          )}

          {currentSession && !workoutComplete && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Current Exercise:</div>
                  <div className="text-primary font-semibold">
                    {currentExercise?.name || 'All exercises complete!'}
                  </div>
                </div>
                {currentExercise && (
                  <Button 
                    size="sm" 
                    onClick={() => completeExercise(currentExercise.name)}
                  >
                    Complete Set
                  </Button>
                )}
              </div>
            </div>
          )}

          {workoutComplete && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-green-800">
                  <div className="font-semibold">🎉 Workout Complete!</div>
                  <div className="text-sm">Great job finishing your workout</div>
                </div>
                <Button onClick={handleCompleteWorkout} size="sm" variant="outline">
                  Finish Session
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise List */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
          {currentSession && (
            <CardDescription>
              {progress.completed} of {progress.total} exercises completed
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plan.exercises.map((exercise, index) => (
              <ExerciseItem
                key={`${exercise.name}-${index}`}
                exercise={exercise}
                isCompleted={currentSession?.completedExercises.includes(exercise.name) || false}
                isCurrent={currentSession ? currentSession.completedExercises.length === index : false}
                onComplete={completeExercise}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
