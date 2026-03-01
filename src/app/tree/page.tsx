'use client'

import { useState } from 'react'
import { useGameState } from '@/hooks/useGameState'
import { CATEGORIES } from '@/types'
import type { Category, GateProgress, Exercise } from '@/types'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { NodeBadge } from '@/components/ui/NodeBadge'
import { getNodeState } from '@/lib/progression'
import { createGateProgress } from '@/lib/gate-check'
import { LEVEL_NAMES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import exercises from '@/data/exercises.json'
import './tree.css'

const typedExercises = exercises as Exercise[]
const MAX_LEVEL = 5

export default function TreePage() {
  const { status, user, gateProgress } = useGameState()
  const [expandedNode, setExpandedNode] = useState<string | null>(null)

  if (status === 'loading') {
    return <div className="loading-state">Loading...</div>
  }

  if (!user) {
    return <div className="loading-state">No data</div>
  }

  const toggleNode = (key: string) => {
    setExpandedNode(prev => prev === key ? null : key)
  }

  // Levels rendered top-down: 5, 4, 3, 2, 1
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => MAX_LEVEL - i)

  return (
    <div className="skill-tree-page">
      <h1 className="skill-tree-page__title">Skill Tree</h1>

      {/* Column headers */}
      <div className="skill-tree-page__cat-headers">
        {CATEGORIES.map(cat => (
          <div key={cat} className="skill-tree-page__cat-col">
            <CategoryBadge category={cat} />
            <span className="skill-tree-page__cat-level">
              L{user.levels[cat]}
            </span>
          </div>
        ))}
      </div>

      {/* Tree grid: each row is a level, each column is a category */}
      <div className="skill-tree-page__grid">
        {levels.map(level => (
          <div key={level} className="skill-tree-page__row">
            {CATEGORIES.map(cat => {
              const nodeKey = `${cat}:${level}`
              const userLevel = user.levels[cat]
              const gate = gateProgress[nodeKey] ?? createGateProgress(cat, level, userLevel)
              const nodeState = getNodeState(gate, user.levels)
              const levelExercises = typedExercises.filter(
                e => e.category === cat && e.level === level
              )
              const hasExercises = levelExercises.length > 0

              return (
                <div key={nodeKey} className="skill-tree-page__node-cell">
                  <button
                    onClick={() => hasExercises ? toggleNode(nodeKey) : undefined}
                    aria-label={`${cat} level ${level} — ${nodeState}`}
                    className={cn(
                      'skill-tree-page__node-btn',
                      hasExercises && 'skill-tree-page__node-btn--interactive',
                      expandedNode === nodeKey && 'skill-tree-page__node-btn--selected',
                    )}
                    disabled={!hasExercises}
                  >
                    <NodeBadge
                      state={nodeState}
                      level={level}
                      consecutivePasses={gate.consecutivePasses}
                    />
                  </button>

                  {/* Connector line to next level below */}
                  {level > 1 && (
                    <div className={cn(
                      'skill-tree-page__connector',
                      level <= userLevel
                        ? 'skill-tree-page__connector--active'
                        : 'skill-tree-page__connector--dim'
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Expanded detail panel */}
      {expandedNode && (
        <ExpandedDetail
          nodeKey={expandedNode}
          gateProgress={gateProgress}
          userLevels={user.levels}
          onClose={() => setExpandedNode(null)}
        />
      )}
    </div>
  )
}

function ExpandedDetail({
  nodeKey,
  gateProgress: gates,
  userLevels,
  onClose,
}: {
  nodeKey: string
  gateProgress: Record<string, GateProgress>
  userLevels: Record<Category, number>
  onClose: () => void
}) {
  const [cat, levelStr] = nodeKey.split(':') as [Category, string]
  const level = Number(levelStr)
  const gate = gates[nodeKey] ?? createGateProgress(cat, level, userLevels[cat])
  const levelExercises = typedExercises.filter(
    e => e.category === cat && e.level === level
  )
  const nodeState = getNodeState(gate, userLevels)

  return (
    <div className={cn('node-detail', `node-detail--${cat}`)}>
      <div className="node-detail__header">
        <div className="node-detail__title-row">
          <CategoryBadge category={cat} />
          <span className="node-detail__level">
            Level {level}
          </span>
          <span className="node-detail__level-name">
            {LEVEL_NAMES[level]}
          </span>
        </div>
        <button onClick={onClose} aria-label="Close detail panel" className="node-detail__close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Gate progress indicator */}
      <div className="node-detail__gate">
        {nodeState === 'passed' ? (
          <span className="node-detail__gate-text--passed">Gate cleared</span>
        ) : nodeState === 'locked' ? (
          <span className="node-detail__gate-text--locked">Locked — complete previous level first</span>
        ) : (
          <div className="node-detail__gate-clean">
            <span className="node-detail__gate-label">Clean sessions</span>
            <div className="node-detail__dots">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={cn(
                    'node-detail__dot',
                    i < gate.consecutivePasses
                      ? 'node-detail__dot--filled'
                      : 'node-detail__dot--empty'
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exercise list with targets */}
      <div className="node-detail__exercises">
        {levelExercises.map(ex => (
          <div
            key={ex.id}
            className="node-detail__ex-row"
          >
            <span className={nodeState === 'locked' ? 'node-detail__ex-name--locked' : 'node-detail__ex-name--active'}>
              {ex.name}
            </span>
            <span className="node-detail__ex-target">
              {ex.isHold
                ? `${ex.targetSets}×${ex.targetHoldSeconds}s`
                : `${ex.targetSets}×${ex.targetReps}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
