/**
 * @file Session history view — displays all logged workouts grouped
 * by training week, sorted newest first.
 *
 * @description
 * Groups sessions by their week start date (Monday) and renders each
 * week as a {@link WeekGroup} containing individual {@link SessionCard}s.
 * Shows the user's current streak and an empty state when no sessions
 * have been logged yet.
 *
 * @example
 * // Used in app/history/page.tsx as a thin wrapper
 * <HistoryView />
 *
 * @see {@link useGameState} for session data and streak computation
 * @see {@link WeekGroup} for the per-week container
 * @see {@link SessionCard} for individual session display
 */
'use client'

import { useMemo } from 'react'
import { useGameState } from '@/hooks/useGameState'
import type { WorkoutSession } from '@/types'
import { getWeekStart } from '@/lib/game/week-progress'
import { WeekGroup } from './WeekGroup'
import './history.css'

/**
 * Renders the full session history, grouped by training week.
 *
 * @description
 * Sessions are grouped by their Monday-based week start date.
 * Weeks are sorted newest-first, and sessions within each week
 * are sorted newest-first. Also tracks which categories were completed
 * per week to power the category dot indicators in {@link WeekGroup}.
 */
export function HistoryView() {
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
