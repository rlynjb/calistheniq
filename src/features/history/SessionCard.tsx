/**
 * @file Expandable session card — shows a summary row that expands
 * to reveal per-exercise progress bars and optional notes.
 *
 * @description
 * Renders a compact row with category badge, date, level, and overall
 * completion percentage. Tapping expands to show each exercise's
 * target met/unmet status with a progress bar. Each card manages
 * its own expanded state independently.
 *
 * @example
 * <SessionCard session={workoutSession} />
 *
 * @see {@link WeekGroup} for the parent container
 * @see {@link WorkoutSession} for the data shape
 */
import { useMemo, useState } from 'react'
import type { WorkoutSession } from '@/types'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { GlowCard } from '@/components/ui/GlowCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils'

interface SessionCardProps {
  /** The completed workout session to display. */
  session: WorkoutSession
}

/**
 * Renders an expandable card for a single logged workout session.
 *
 * @description
 * Collapsed state shows: category badge, formatted date, level, and
 * completion percentage (green if 100%, muted otherwise). A chevron
 * rotates when expanded to reveal per-exercise breakdowns.
 *
 * Completion percentage is calculated as the ratio of exercises that
 * hit their target vs. total exercises (not sets).
 */
export function SessionCard({ session }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const completionPct = useMemo(() => {
    if (!session.exercises.length) return 0
    const met = session.exercises.filter(e => e.hitTarget).length
    return Math.round((met / session.exercises.length) * 100)
  }, [session.exercises])

  const dateFormatted = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <GlowCard glow="none" className="p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="session-card__btn"
      >
        <div className="session-card__row">
          <div className="session-card__info">
            <CategoryBadge category={session.category} />
            <div>
              <p className="session-card__date">{dateFormatted}</p>
              <p className="session-card__level">L{session.level}</p>
            </div>
          </div>
          <div className="session-card__right">
            <span className={cn(
              'session-card__pct',
              completionPct === 100 ? 'session-card__pct--perfect' : 'session-card__pct--partial'
            )}>
              {completionPct}%
            </span>
            <svg
              className={cn(
                'session-card__chevron',
                expanded && 'session-card__chevron--open'
              )}
              viewBox="0 0 12 12"
            >
              <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="session-card__detail">
          {session.exercises.map(entry => (
            <div key={entry.exerciseId} className="session-card__entry">
              <div className="session-card__entry-header">
                <span className="session-card__entry-name">{entry.exerciseId}</span>
                <span className={cn(
                  'session-card__entry-status',
                  entry.hitTarget ? 'session-card__entry-status--met' : 'session-card__entry-status--unmet'
                )}>
                  {entry.hitTarget ? 'Met' : `${entry.actualSets}/${entry.targetSets}`}
                </span>
              </div>
              <ProgressBar
                value={entry.targetSets > 0 ? Math.round((entry.actualSets / entry.targetSets) * 100) : 0}
                color={entry.hitTarget ? 'emerald' : 'muted'}
              />
            </div>
          ))}
          {session.notes && (
            <p className="session-card__notes">{session.notes}</p>
          )}
        </div>
      )}
    </GlowCard>
  )
}
