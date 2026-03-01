/**
 * @file Expanded skill tree node detail panel — shows gate status,
 * clean session dots, and exercise targets for a selected node.
 *
 * @description
 * Appears below the tree grid when a node is tapped. Parses the
 * composite `nodeKey` ("category:level") to look up gate progress
 * and filter exercises from the library. Displays three possible
 * states: passed (gate cleared), locked (previous level not done),
 * or in-progress (with a visual dot indicator for 0–3 clean sessions).
 *
 * @example
 * <NodeDetail
 *   nodeKey="push:2"
 *   gateProgress={gateProgress}
 *   userLevels={user.levels}
 *   onClose={() => setExpandedNode(null)}
 * />
 *
 * @see {@link TreeView} for the parent that manages expansion state
 * @see {@link getNodeState} for how the node's visual state is derived
 */
import type { Category, GateProgress, Exercise } from '@/types'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { getNodeState } from '@/lib/game/progression'
import { createGateProgress } from '@/lib/game/gate-check'
import { LEVEL_NAMES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import exercises from '@/data/exercises.json'

const typedExercises = exercises as Exercise[]

interface NodeDetailProps {
  /**
   * Composite key identifying the node, in `"category:level"` format.
   * @example "push:2"
   */
  nodeKey: string

  /** Full gate progress map from useGameState, keyed by `"category:level"`. */
  gateProgress: Record<string, GateProgress>

  /** User's current level per category — used to determine node state (locked/open/passed). */
  userLevels: Record<Category, number>

  /** Callback to close this detail panel. */
  onClose: () => void
}

/**
 * Renders the detail panel for a skill tree node with gate status
 * and exercise targets.
 *
 * @description
 * The panel is category-colored via a BEM modifier (`node-detail--push`).
 * Gate section shows one of three states:
 * - **Passed**: "Gate cleared" text
 * - **Locked**: "Complete previous level first" message
 * - **In-progress**: 3 dots indicating consecutive clean sessions (0–3)
 *
 * Exercise list shows name and target (sets × reps or sets × seconds).
 * Exercise names are dimmed when the node is locked.
 */
export function NodeDetail({
  nodeKey,
  gateProgress: gates,
  userLevels,
  onClose,
}: NodeDetailProps) {
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
