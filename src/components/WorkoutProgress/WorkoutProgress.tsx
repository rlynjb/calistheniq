'use client'

import { Badge } from '@/components/ui/badge'
import { workoutProgressData } from '@/data/WorkoutProgress'
import './WorkoutProgress.css'

export default function WorkoutProgress() {
  const { 
    lastWorkout, 
    todaysWorkout, 
    progressComparisons
  } = workoutProgressData

  return (
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
              {lastWorkout.date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              })} • {lastWorkout.duration} min
            </div>
          </div>
          
          <div className="space-y-3">
            {lastWorkout.exercises.map((exercise, exerciseIndex) => (
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
                    <span className="font-medium">{exercise.tempo}</span>
                    <span className="text-muted-foreground ml-3">Rest: </span>
                    <span className="font-medium">{exercise.rest}s</span>
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
            {todaysWorkout.exercises.map((exercise, exerciseIndex) => (
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
                    <span className="font-medium">{exercise.tempo}</span>
                    <span className="text-muted-foreground ml-3">Rest: </span>
                    <span className="font-medium">{exercise.rest}s</span>
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-blue-100/50 rounded text-xs">
                  <div className="text-xs text-blue-600 font-medium mb-1">PROGRESSION NOTE</div>
                  <div className="text-blue-800">{exercise.notes}</div>
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
          {progressComparisons.map((comparison, index) => (
            <div key={index} className="bg-white/50 rounded p-3">
              <div className="text-sm font-medium mb-2">{comparison.exerciseName}</div>
              <div className="space-y-1">
                <div className="text-xs">
                  <span className="text-muted-foreground">Last: </span>
                  <span className="font-medium">{comparison.lastTotal}</span>
                  <span className="text-muted-foreground ml-2">Target: </span>
                  <span className="font-medium">{comparison.todayTotal}</span>
                </div>
                <div className="flex items-center gap-2">
                  {comparison.hasImprovement ? (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                      +{comparison.improvement} ({comparison.improvementPercent > 0 ? `+${comparison.improvementPercent}` : comparison.improvementPercent}%)
                    </Badge>
                  ) : comparison.isDecline ? (
                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                      {comparison.improvement} ({comparison.improvementPercent}%)
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Maintain
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
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
  )
}
