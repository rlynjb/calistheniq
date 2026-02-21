'use client'

import { Badge } from '@/components/ui'
import type { CurrentUserLevels } from '@/api'
import './CurrentLevelsOverview.css'

interface CurrentLevelsOverviewProps {
  currentLevels: CurrentUserLevels
}

export default function CurrentLevelsOverview({ currentLevels }: CurrentLevelsOverviewProps) {
  return (
    <div className="current-levels-overview">
      <div className="current-levels-overview__header">
        <div className="current-levels-overview__title">Your Current Levels</div>
      </div>
      <div className="current-levels-overview__grid">
        {Object.entries(currentLevels).map(([category, level]) => (
          <div key={category} className={`current-levels-overview__item current-levels-overview__item--${category.toLowerCase()}`}>
            <div className="current-levels-overview__category">{category}</div>
            <Badge variant="default" className={`current-levels-overview__badge current-levels-overview__badge--${category.toLowerCase()}`}>
              Level {level}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
