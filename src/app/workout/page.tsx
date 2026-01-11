import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function WorkoutPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Workout Plan</h1>
        <p className="text-muted-foreground">
          25-minute full-body beginner workout - Focus on form and controlled movement
        </p>
      </div>

      {/* Workout Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Today's Session Summary</CardTitle>
          <CardDescription>Full body strength with TRX and bodyweight</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-fitness-600">25</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-fitness-600">4</div>
              <div className="text-sm text-muted-foreground">Exercises</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-fitness-600">3</div>
              <div className="text-sm text-muted-foreground">Rounds</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Blocks */}
      <div className="space-y-6">
        {/* Warm-up */}
        <Card>
          <CardHeader>
            <CardTitle className="text-fitness-600">🔥 Warm-up (5 min)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="exercise-item">
                <div>
                  <div className="font-medium">Ankle Rocks</div>
                  <div className="text-sm text-muted-foreground">45 seconds each direction</div>
                </div>
                <div className="text-sm bg-secondary px-3 py-1 rounded-full">Mobility</div>
              </div>
              <div className="exercise-item">
                <div>
                  <div className="font-medium">Hip Flexor Stretch</div>
                  <div className="text-sm text-muted-foreground">30 seconds each side</div>
                </div>
                <div className="text-sm bg-secondary px-3 py-1 rounded-full">Stretch</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Block */}
        <Card>
          <CardHeader>
            <CardTitle className="text-fitness-600">💪 Block A - Circuit (15 min)</CardTitle>
            <CardDescription>3 rounds, 60 seconds rest between exercises</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="exercise-item">
                <div>
                  <div className="font-medium">TRX Row</div>
                  <div className="text-sm text-muted-foreground">3 sets × 8-12 reps | Tempo: 21X1</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Keep body straight, squeeze shoulder blades
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded">Pull</div>
                  <div className="text-xs bg-fitness-100 text-fitness-700 px-2 py-1 rounded">TRX</div>
                </div>
              </div>
              
              <div className="exercise-item">
                <div>
                  <div className="font-medium">Incline Push-up</div>
                  <div className="text-sm text-muted-foreground">3 sets × 6-10 reps | Tempo: 3111</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Use stairs or elevated surface, control the descent
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-xs bg-energy-100 text-energy-700 px-2 py-1 rounded">Push</div>
                  <div className="text-xs bg-fitness-100 text-fitness-700 px-2 py-1 rounded">Bodyweight</div>
                </div>
              </div>

              <div className="exercise-item">
                <div>
                  <div className="font-medium">Glute Bridge</div>
                  <div className="text-sm text-muted-foreground">3 sets × 12-15 reps | Tempo: 2121</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Squeeze glutes at the top, knee-friendly
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-xs bg-warning-100 text-warning-700 px-2 py-1 rounded">Hinge</div>
                  <div className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded">Knee-friendly</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finisher */}
        <Card>
          <CardHeader>
            <CardTitle className="text-fitness-600">🔥 Finisher (3 min)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="exercise-item">
              <div>
                <div className="font-medium">Wall Sit</div>
                <div className="text-sm text-muted-foreground">2 sets × 30 seconds</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Back against wall, thighs parallel to ground
                </div>
              </div>
              <div className="text-sm bg-fitness-100 text-fitness-700 px-3 py-1 rounded-full">Core</div>
            </div>
          </CardContent>
        </Card>

        {/* Cool-down */}
        <Card>
          <CardHeader>
            <CardTitle className="text-fitness-600">😌 Cool-down (2 min)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="exercise-item">
              <div>
                <div className="font-medium">Hip Flexor Stretch</div>
                <div className="text-sm text-muted-foreground">45 seconds each side</div>
              </div>
              <div className="text-sm bg-secondary px-3 py-1 rounded-full">Recovery</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Button variant="fitness" size="lg" className="flex-1">
          Start Workout
        </Button>
        <Button variant="outline" size="lg">
          Modify Plan
        </Button>
      </div>
    </div>
  )
}
