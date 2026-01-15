'use client'

import { Badge } from '@/components/ui/badge'
import type { 
  WorkoutLevel, 
  BaseExercise as Exercise 
} from '@/types'
import { getLevelByIndex } from '@/data/WorkoutLevels'
import { currentLevelData, type MovementCategory } from '@/data/CurrentLevel'

export default function CurrentLevel() {
  const { 
    currentLevels, 
    progressStats, 
    personalizedRecommendations 
  } = currentLevelData

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-4">
        Your current level progress across movement categories
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {Object.entries(currentLevels).map(([category, level]) => {
          const levelInfo = getLevelByIndex(level)
          const nextLevel = getLevelByIndex(level + 1)
          
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
                
                {levelInfo?.description && (
                  <p className="text-xs text-muted-foreground">{levelInfo.description}</p>
                )}
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Current Exercises:</h4>
                  {levelInfo?.exercises[category as MovementCategory]?.map((exercise: Exercise, index: number) => (
                    <div key={index} className="bg-secondary/30 rounded p-2">
                      <div className="text-sm font-medium">{exercise.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {exercise.sets.length} Sets: {exercise.sets.map((set) => 
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
              <span className="font-medium">{progressStats.overallLevel}</span>
            </div>
            
            <div className="text-sm">
              <span className="text-muted-foreground">Strongest Area: </span>
              <span className="font-medium text-green-600">{progressStats.strongestArea}</span>
            </div>
            
            <div className="text-sm">
              <span className="text-muted-foreground">Focus Area: </span>
              <span className="font-medium text-orange-600">{progressStats.focusArea}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Progression: </span>
              <span className="font-medium">{progressStats.progressToMastery}%</span>
            </div>
            
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressStats.progressToMastery}%` }}
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
          {personalizedRecommendations.map((recommendation, index) => (
            <p key={index}>• {recommendation}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
