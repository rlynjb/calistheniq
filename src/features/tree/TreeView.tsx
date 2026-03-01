/**
 * @file Skill tree visualization — a 3-column (push/pull/squat) by
 * 5-row (levels) grid showing the user's progression across all categories.
 *
 * @description
 * Each node in the grid represents a category/level combination.
 * Nodes are color-coded by state (locked, in-progress, passed) via
 * {@link NodeBadge}. Tapping a node with exercises expands a detail
 * panel ({@link NodeDetail}) showing gate progress and exercise targets.
 * Connector lines between levels indicate progression path.
 *
 * @example
 * // Used in app/tree/page.tsx as a thin wrapper
 * <TreeView />
 *
 * @see {@link useGameState} for gateProgress and user levels
 * @see {@link NodeDetail} for the expanded detail panel
 * @see {@link getNodeState} for how node states are derived from gate progress
 */
'use client'

import { useState } from 'react'
import { useGameState } from '@/hooks/useGameState'
import { CATEGORIES } from '@/types'
import type { Exercise } from '@/types'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { NodeBadge } from '@/components/ui/NodeBadge'
import { getNodeState } from '@/lib/game/progression'
import { createGateProgress } from '@/lib/game/gate-check'
import { cn } from '@/lib/utils'
import exercises from '@/data/exercises.json'
import { NodeDetail } from './NodeDetail'
import './tree.css'

const typedExercises = exercises as Exercise[]
/** Maximum skill level in the system. Grid renders rows from MAX_LEVEL down to 1. */
const MAX_LEVEL = 5

/**
 * Renders a 3×5 skill tree grid with expandable node details.
 *
 * @description
 * Grid layout: columns are categories (push, pull, squat),
 * rows are levels (5 at top, 1 at bottom — higher = harder).
 * Each node shows a {@link NodeBadge} with visual state and a
 * consecutive-pass counter. Nodes without exercises in the library
 * are disabled. Only one node can be expanded at a time.
 */
export function TreeView() {
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
        <NodeDetail
          nodeKey={expandedNode}
          gateProgress={gateProgress}
          userLevels={user.levels}
          onClose={() => setExpandedNode(null)}
        />
      )}
    </div>
  )
}
