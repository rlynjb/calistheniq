/**
 * @file Core domain types for the game progression system.
 *
 * @description
 * Defines the data shapes for exercises, users, workout sessions,
 * gate progression, week tracking, and draft persistence. These types
 * are the shared language between storage, game logic, and UI layers.
 *
 * Categories use lowercase (`'push'`) in game logic. The legacy API
 * layer uses PascalCase (`'Push'`) — see `types/legacy.ts` for those types.
 *
 * @see {@link types/legacy.ts} for API/sync types with PascalCase categories
 */

// ── Category ─────────────────────────────────────────────────

/**
 * The three training disciplines. Every user trains one session
 * per category per week (3 total) to maintain their streak.
 */
export type Category = 'push' | 'pull' | 'squat'

/**
 * Ordered list of all categories.
 * Used for iteration in UI grids, week tracking, and gate initialization.
 */
export const CATEGORIES: Category[] = ['push', 'pull', 'squat']

// ── Exercise library ────────────────────────────────────────

/**
 * A single exercise definition from the exercise library (`data/exercises.json`).
 * Exercises are immutable reference data — users don't create or modify these.
 */
export type Exercise = {
  /** Unique identifier matching entries in exercises.json (e.g., `"push-1-pushups"`). */
  id: string

  /** Human-readable display name (e.g., "Wall Push-ups"). */
  name: string

  /** Which training discipline this exercise belongs to. */
  category: Category

  /** Skill level this exercise is assigned to (1–5). */
  level: number

  /** Number of sets the user should complete to meet the target. */
  targetSets: number

  /**
   * Reps per set for non-isometric exercises.
   * Ignored when `isHold` is true — use `targetHoldSeconds` instead.
   */
  targetReps: number

  /**
   * Whether this exercise is an isometric hold (e.g., plank, L-sit).
   * When true, reps are replaced by hold duration in seconds.
   */
  isHold: boolean

  /** Target hold duration in seconds per set. Only meaningful when `isHold` is true. */
  targetHoldSeconds?: number
}

// ── User ────────────────────────────────────────────────────

/**
 * The user's profile and progression state.
 * Each user has an independent skill level per category.
 */
export type User = {
  /** Unique user identifier. */
  id: string

  /**
   * Current skill level per category (1–5).
   * Levels advance when the user passes a gate (3 consecutive clean sessions).
   */
  levels: Record<Category, number>

  /** ISO 8601 timestamp of when the user was first created. */
  createdAt: string
}

// ── Workout session (logged by user) ────────────────────────

/**
 * A single exercise's recorded performance within a workout session.
 * Each entry tracks what the user actually achieved vs. the target.
 */
export type ExerciseEntry = {
  /** References an {@link Exercise.id} from the exercise library. */
  exerciseId: string

  /** Target number of sets for this exercise at this level. */
  targetSets: number

  /** Target reps per set (for non-isometric exercises). */
  targetReps: number

  /** How many sets the user actually completed (checked off). */
  actualSets: number

  /**
   * Reps achieved per set, indexed by set number.
   * @example [10, 10, 8] — three sets, last one fell short
   */
  actualReps: number[]

  /**
   * Hold duration achieved per set in seconds (isometric exercises only).
   * @example [30, 30, 25] — three sets of a plank hold
   */
  actualHoldSeconds?: number[]

  /**
   * Per-set completion flags, indexed by set number.
   * A set must be checked to count toward `actualSets`.
   * @example [true, true, true]
   */
  checkedSets: boolean[]

  /**
   * Whether all checked sets met or exceeded their target.
   * This is the key input for gate evaluation — a session is "clean"
   * only when every exercise entry has `hitTarget: true`.
   */
  hitTarget: boolean
}

/**
 * A completed workout session saved by the user.
 * One session covers all exercises for a single category at a single level.
 */
export type WorkoutSession = {
  /**
   * Unique session ID, generated client-side.
   * Format: `"category-level-timestamp"` (e.g., `"push-2-1709312000000"`).
   */
  id: string

  /** ISO 8601 date string of when the session was logged. */
  date: string

  /** The skill level at which this session was performed (1–5). */
  level: number

  /** The training discipline this session covers. */
  category: Category

  /** Performance entries for each exercise in this category/level. */
  exercises: ExerciseEntry[]

  /** Optional free-text notes the user attached to the session. */
  notes?: string
}

// ── Gate system ─────────────────────────────────────────────

/**
 * Progression lifecycle of a gate.
 * - `locked` — user hasn't reached this level yet
 * - `in-progress` — user is working toward passing (0–2 clean sessions)
 * - `passed` — user completed 3 consecutive clean sessions, level unlocked
 */
export type GateStatus = 'locked' | 'in-progress' | 'passed'

/**
 * Tracks a user's progress toward passing a level gate.
 * A gate requires 3 consecutive clean sessions to pass.
 * Any non-clean session resets `consecutivePasses` to 0.
 */
export type GateProgress = {
  /** The skill level this gate guards (1–5). */
  level: number

  /** The training discipline this gate belongs to. */
  category: Category

  /** Current lifecycle state of this gate. */
  status: GateStatus

  /**
   * Number of consecutive clean sessions (0–3).
   * Resets to 0 on any non-clean session. Gate passes at 3.
   */
  consecutivePasses: number

  /** ISO 8601 timestamp of the most recent session evaluated against this gate. */
  lastSessionDate?: string
}

/**
 * Per-exercise targets used by gate evaluation to determine if a session is "clean".
 *
 * @see {@link GateCriteria} for the container that groups these per level
 */
export type GateCriteriaExercise = {
  /** References an {@link Exercise.id} from the exercise library. */
  exerciseId: string

  /** Number of sets required to meet this exercise's gate criteria. */
  targetSets: number

  /** Reps per set required (for non-isometric exercises). */
  targetReps?: number

  /** Hold seconds per set required (for isometric exercises). */
  targetHoldSeconds?: number
}

/**
 * Gate criteria for a specific category/level combination.
 * Defines how many consecutive clean sessions are required and
 * what each exercise must achieve to count as "clean".
 */
export type GateCriteria = {
  /**
   * How many consecutive clean sessions are needed to pass the gate.
   * Currently always 3 across all levels.
   */
  requiredConsecutivePasses: number

  /** Per-exercise targets that must all be met for a session to count as clean. */
  exercises: GateCriteriaExercise[]
}

// ── Week tracking ───────────────────────────────────────────

/**
 * Tracks which categories have been completed in a given training week.
 * A week is "complete" when all 3 categories are true.
 *
 * @see {@link calculateStreak} for how completed weeks contribute to streaks
 */
export type WeekProgress = {
  /**
   * ISO date string of the Monday that starts this training week.
   * @example "2025-03-03"
   */
  weekStart: string

  /** Per-category completion status for this week. */
  sessionsCompleted: Record<Category, boolean>
}

// ── Draft session (auto-saved form state) ────────────────────

/**
 * Per-exercise form state saved as part of a draft.
 * Mirrors the in-memory state of {@link useExerciseForm} for a single exercise.
 */
export type ExerciseFormState = {
  /** References an {@link Exercise.id} from the exercise library. */
  exerciseId: string

  /** Per-set checked flags (user toggled this set as completed). */
  checkedSets: boolean[]

  /** Per-set reps entered by the user. */
  actualReps: number[]

  /** Per-set hold seconds entered (isometric exercises only). */
  actualHoldSeconds?: number[]
}

/**
 * Auto-saved snapshot of an in-progress workout form.
 * Persisted to blob storage on a 500ms debounce so the user
 * can leave and resume without losing their input.
 *
 * @see {@link useExerciseForm} for the hook that manages draft auto-saving
 */
export type DraftSession = {
  /** The category this draft belongs to. */
  category: Category

  /** The level this draft was started at. */
  level: number

  /** Per-exercise form state snapshots. */
  exercises: ExerciseFormState[]

  /** Free-text session notes entered so far. */
  notes: string

  /** ISO 8601 timestamp of when this draft was last auto-saved. */
  savedAt: string
}
