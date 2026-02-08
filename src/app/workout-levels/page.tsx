'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import WorkoutLevels from '@/components/WorkoutLevels'

export default function WorkoutLevelsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </Link>
              <span className="text-lg font-medium">Workout Levels</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <WorkoutLevels />
        </CardContent>
      </Card>
    </div>
  )
}
