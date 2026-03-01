'use client'

import { useState, useRef } from 'react'
import { useGameState } from '@/hooks/useGameState'
import type { Category, DraftSession, WorkoutSession } from '@/types'
import { CATEGORIES } from '@/types'
import type { LogSessionResult } from '@/hooks/useGameState'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { GlowCard } from '@/components/ui/GlowCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { GatePassedModal } from '@/components/GatePassedModal'
import { ExerciseForm } from './ExerciseForm'
import { SessionResult } from './SessionResult'
import { LEVEL_NAMES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import './home.css'

export default function HomePage() {
  const {
    status, user, categoryDoneThisWeek, weekComplete,
    completedThisWeek, streak, sessions, getGateForCategory, logSession,
    saveDraft, loadDraft,
  } = useGameState()

  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null)
  const [activeDraft, setActiveDraft] = useState<DraftSession | null>(null)
  const [result, setResult] = useState<LogSessionResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [levelUpInfo, setLevelUpInfo] = useState<{
    category: Category; oldLevel: number; newLevel: number
  } | null>(null)
  const loadingCatRef = useRef<string | null>(null)

  if (status === 'loading') {
    return <div className="loading-state">Loading...</div>
  }

  if (status === 'error' || !user) {
    return (
      <div className="loading-state flex-col gap-3">
        <p>Failed to load data</p>
      </div>
    )
  }

  const handleToggleCategory = async (cat: Category) => {
    if (expandedCategory === cat) {
      setExpandedCategory(null)
      setActiveDraft(null)
      setResult(null)
      loadingCatRef.current = null
      return
    }
    if (categoryDoneThisWeek[cat]) return
    loadingCatRef.current = cat
    const draft = await loadDraft(cat, user.levels[cat])
    if (loadingCatRef.current !== cat) return
    setActiveDraft(draft)
    setExpandedCategory(cat)
    setResult(null)
    setSaving(false)
    setSaveError(null)
  }

  const handleSaveDraft = (draft: DraftSession) => {
    saveDraft(draft).catch(() => {})
  }

  const handleSave = async (session: WorkoutSession) => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await logSession(session)
      setActiveDraft(null)
      setResult(res)
      if (res.leveledUp && res.newLevel) {
        setLevelUpInfo({
          category: session.category,
          oldLevel: session.level,
          newLevel: res.newLevel,
        })
      }
    } catch {
      setSaveError('Failed to save session. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDone = () => {
    setExpandedCategory(null)
    setResult(null)
  }

  const remaining = 3 - completedThisWeek

  return (
    <div className="home-page">
      {/* Header: streak + week progress */}
      <div className="home-page__header">
        <div>
          <h1 className="home-page__title">This Week</h1>
          <p className="home-page__subtitle">
            {completedThisWeek}/3 sessions
          </p>
        </div>
        {streak > 0 && (
          <div className="streak-badge">
            <span className="streak-badge__count">{streak}</span>
            <span className="streak-badge__label">week streak</span>
          </div>
        )}
      </div>

      {/* Overall week progress bar */}
      <div>
        <ProgressBar
          value={Math.round((completedThisWeek / 3) * 100)}
          color={weekComplete ? 'emerald' : 'cyan'}
          label={weekComplete ? 'Week complete!' : `${completedThisWeek} of 3`}
        />
        {!weekComplete && (
          <p className="home-page__remaining">
            {remaining} session{remaining !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>

      {/* Category rows */}
      <div className="home-page__categories">
        {CATEGORIES.map(cat => {
          const done = categoryDoneThisWeek[cat]
          const level = user.levels[cat]
          const gate = getGateForCategory(cat)
          const passes = gate?.consecutivePasses ?? 0
          const isExpanded = expandedCategory === cat
          const showResult = isExpanded && result !== null
          const isDimmed = done && !isExpanded

          const statusText = isDimmed
            ? '✓ Done this week'
            : isExpanded
              ? (showResult ? 'Session logged' : 'Logging...')
              : `${passes}/3 clean sessions · Tap to log`

          return (
            <GlowCard
              key={cat}
              glow={isDimmed ? 'none' : isExpanded ? cat : 'none'}
              className={cn('p-0', isDimmed && 'category-row--dimmed')}
            >
              {/* Tappable category header */}
              <button
                type="button"
                className={cn(
                  'category-row__header w-full text-left',
                  !isDimmed && 'category-row__header--clickable',
                )}
                onClick={() => handleToggleCategory(cat)}
                disabled={isDimmed}
              >
                <div className="category-row__top">
                  <div className="category-row__info">
                    <CategoryBadge category={cat} />
                    <div>
                      <p className="category-row__level">
                        Level {level}
                        <span className="category-row__level-name">
                          {LEVEL_NAMES[level] ?? ''}
                        </span>
                      </p>
                      <p className="category-row__status">{statusText}</p>
                    </div>
                  </div>
                  <div className="category-row__actions">
                    {isDimmed ? (
                      <span className="category-row__check">✓</span>
                    ) : (
                      <ChevronIcon expanded={isExpanded} />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded: exercise form */}
              {isExpanded && !showResult && (
                <div className="category-row__divider">
                  <ExerciseForm
                    category={cat}
                    level={level}
                    sessions={sessions}
                    saving={saving}
                    saveError={saveError}
                    draft={activeDraft}
                    onSave={handleSave}
                    onSaveDraft={handleSaveDraft}
                  />
                </div>
              )}

              {/* Expanded: inline result */}
              {isExpanded && showResult && result && (
                <div className="category-row__divider">
                  <SessionResult
                    result={result}
                    onDone={handleDone}
                  />
                </div>
              )}
            </GlowCard>
          )
        })}
      </div>

      {/* Week complete banner (only when nothing expanded) */}
      {weekComplete && !expandedCategory && (
        <div className="home-page__week-banner">
          All sessions logged this week!
        </div>
      )}

      {/* Level up modal */}
      {levelUpInfo && (
        <GatePassedModal
          category={levelUpInfo.category}
          oldLevel={levelUpInfo.oldLevel}
          newLevel={levelUpInfo.newLevel}
          onClose={() => setLevelUpInfo(null)}
        />
      )}
    </div>
  )
}

// ── Chevron Icon (20 lines, no state, used once — stays inline) ──

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'chevron-icon',
        expanded && 'chevron-icon--expanded'
      )}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
