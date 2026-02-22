'use client'

import Link from 'next/link'
import WorkoutLevels from '@/components/WorkoutLevels'

export default function WorkoutLevelsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        ← Back
      </Link>

      <WorkoutLevels />
    </div>
  )
}
