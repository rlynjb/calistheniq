'use client'

import { useState, useEffect } from 'react'
import { api } from '@/api'
import type { CurrentUserLevels } from '@/api'
import CurrentLevelsOverview from '@/components/CurrentLevelsOverview'
import WeeklyProgress from '@/components/WeeklyProgress'

export default function DashboardPage() {
  const [currentLevels, setCurrentLevels] = useState<CurrentUserLevels | null>(null)

  useEffect(() => {
    const fetchLevels = async () => {
      const userData = await api.user.getUserData()
      if (userData?.currentLevels) {
        setCurrentLevels(userData.currentLevels)
      }
    }
    fetchLevels()
  }, [])

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {currentLevels && <CurrentLevelsOverview currentLevels={currentLevels} />}
      <WeeklyProgress />
    </div>
  )
}
