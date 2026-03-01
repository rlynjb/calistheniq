'use client'

import { useMemo, useState } from 'react'
import { useGameState } from '@/hooks/useGameState'
import type { Category, WorkoutSession } from '@/types'
import { CATEGORIES } from '@/types'
import { getWeekStart } from '@/lib/week-progress'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { GlowCard } from '@/components/ui/GlowCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils'
import './history.css'

export default function HistoryPage() {
  const { status, sessions, streak } = useGameState()

  const weekGroups = useMemo(() => {
    if (!sessions.length) return []

    const byWeek = new Map<string, WorkoutSession[]>()
    for (const s of sessions) {
      const ws = getWeekStart(new Date(s.date))
      if (!byWeek.has(ws)) byWeek.set(ws, [])
      byWeek.get(ws)!.push(s)
    }

    return Array.from(byWeek.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekStart, weekSessions]) => ({
        weekStart,
        sessions: weekSessions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        categories: new Set(weekSessions.map(s => s.category)),
      }))
  }, [sessions])

  if (status === 'loading') {
    return <div className="loading-state">Loading...</div>
  }

  return (
    <div className="history-page">
      <div className="history-page__header">
        <h1 className="history-page__title">History</h1>
        {streak > 0 && (
          <span className="history-page__streak">{streak} week streak</span>
        )}
      </div>

      {weekGroups.length === 0 ? (
        <div className="history-page__empty">
          No sessions logged yet. Start training!
        </div>
      ) : (
        <div className="history-page__weeks">
          {weekGroups.map(group => (
            <WeekGroup key={group.weekStart} {...group} />
          ))}
        </div>
      )}
    </div>
  )
}

const catDotMap: Record<Category, string> = {
  push: 'week-group__dot--done-push',
  pull: 'week-group__dot--done-pull',
  squat: 'week-group__dot--done-squat',
}

function WeekGroup({
  weekStart,
  sessions,
  categories,
}: {
  weekStart: string
  sessions: WorkoutSession[]
  categories: Set<Category>
}) {
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
        <div className="flex items-center gap-2">
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

function SessionCard({ session }: { session: WorkoutSession }) {
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
