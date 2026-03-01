/**
 * @file Week group container — renders a date range header with
 * category completion dots and a list of session cards for one training week.
 *
 * @description
 * Used within {@link HistoryView} to visually separate sessions by week.
 * The header shows "Mon — Sun" date range and three colored dots
 * indicating which categories were completed that week. Each dot
 * is color-coded by category (push/pull/squat) or empty if not done.
 *
 * @example
 * <WeekGroup
 *   weekStart="2025-03-03"
 *   sessions={weekSessions}
 *   categories={completedCategorySet}
 * />
 *
 * @see {@link HistoryView} for the parent that groups sessions by week
 * @see {@link SessionCard} for individual session rendering
 */
import { useMemo } from 'react'
import type { Category, WorkoutSession } from '@/types'
import { CATEGORIES } from '@/types'
import { cn } from '@/lib/utils'
import { SessionCard } from './SessionCard'

/**
 * Maps each category to its BEM modifier class for the completion dot.
 * Used to apply category-specific coloring to the dot indicators.
 */
const catDotMap: Record<Category, string> = {
  push: 'week-group__dot--done-push',
  pull: 'week-group__dot--done-pull',
  squat: 'week-group__dot--done-squat',
}

interface WeekGroupProps {
  /**
   * ISO date string of the Monday that starts this week.
   * @example "2025-03-03"
   */
  weekStart: string

  /** Sessions logged during this week, pre-sorted newest first. */
  sessions: WorkoutSession[]

  /** Set of categories that had at least one session logged this week. */
  categories: Set<Category>
}

/**
 * Renders a single training week with date header, category dots,
 * and expandable session cards.
 */
export function WeekGroup({
  weekStart,
  sessions,
  categories,
}: WeekGroupProps) {
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 6)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }, [weekStart])

  const weekStartFormatted = new Date(weekStart).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const allCats = CATEGORIES

  return (
    <div>
      <div className="week-group__header">
        <div className="week-group__date-row">
          <span className="week-group__date">
            {weekStartFormatted} — {weekEnd}
          </span>
        </div>
        <div className="week-group__dots">
          {allCats.map(cat => (
            <div
              key={cat}
              className={cn(
                'week-group__dot',
                categories.has(cat) ? catDotMap[cat] : 'week-group__dot--empty'
              )}
              title={`${cat}: ${categories.has(cat) ? 'done' : 'not done'}`}
              aria-label={`${cat}: ${categories.has(cat) ? 'done' : 'not done'}`}
            />
          ))}
        </div>
      </div>

      <div className="week-group__sessions">
        {sessions.map(session => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}
