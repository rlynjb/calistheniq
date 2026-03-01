# Contrl — Codebase Audit & Phase Handoff

> **Snapshot date:** 2026-03-01
> **Branch:** `newdesign`
> **Build status:** `npm run build` passes, `vitest run` passes (45/45 tests)

---

## 1. Architecture Summary

### Stack

| Layer      | Technology                   | Notes                                     |
|------------|------------------------------|--------------------------------------------|
| Framework  | Next.js 14 (App Router)      | Static pages + `'use client'` feature views |
| Styling    | Tailwind CSS 3 + BEM CSS     | `@apply` in `.css` files, `cn()` for toggling modifiers |
| Fonts      | Chakra Petch (display) + Share Tech Mono (mono) | Self-hosted via `next/font/google` |
| Persistence| Netlify Blobs (cloud)        | Key-value via generic `/game/data` function |
| Functions  | Netlify Functions (v2)       | 5 endpoints under `netlify/functions/`     |
| Dev mocking| MSW 2                        | In-memory `Map` store, toggled via `NEXT_PUBLIC_MSW_ENABLED` |
| Testing    | Vitest 4                     | 4 test files covering game logic           |
| Hosting    | Netlify                      | `@netlify/plugin-nextjs`, `/api/*` → `/.netlify/functions/:splat` redirect |

### Directory Layout

```
src/
├── app/            ← Next.js App Router pages (thin wrappers only)
├── components/     ← Shared UI primitives (GlowCard, ProgressBar, etc.)
├── features/       ← Feature modules (home, tree, history)
│   ├── home/       ← Weekly session logging
│   ├── tree/       ← Skill tree visualization
│   └── history/    ← Session history grouped by week
├── hooks/          ← useGameState (single gateway hook)
├── lib/
│   ├── game/       ← Pure logic: gate-check, progression, streaks, week-progress
│   ├── storage/    ← StorageProvider interface + NetlifyBlobAdapter
│   ├── api-client.ts
│   ├── constants.ts
│   ├── session-helpers.ts
│   └── utils.ts
├── mocks/          ← MSW handlers + mock data
├── data/           ← Static JSON: exercises.json, gates.json
└── types/          ← Domain types + legacy types
```

### Key Architectural Decisions

1. **Feature-first directory structure.** All components live in `src/features/` or `src/components/`. The `app/` directory contains only page wrappers, layout, error, and loading — no `'use client'` code.

2. **Single gateway hook.** `useGameState()` is the only way the UI accesses data. Every feature view destructures from it rather than touching storage directly.

3. **Pure game logic layer.** All progression rules (gate evaluation, level-ups, streak calculation, week tracking) live in `src/lib/game/` as pure functions with no React dependency. All 45 tests target this layer.

4. **BEM CSS with `@apply`.** Tailwind remains the design system, but class strings live in co-located `.css` files using BEM naming. Components use `cn()` to toggle BEM modifier classes.

5. **Adapter pattern for storage.** `StorageProvider` interface allows swapping backends (currently `NetlifyBlobAdapter`). Singleton via `getStorage()`.

---

## 2. File-by-File Inventory

### `src/app/` — App shell & pages

| File | Purpose | LOC |
|------|---------|-----|
| `layout.tsx` | Root layout: fonts, `<MSWProvider>`, header wordmark, `<BottomNav>`, `<main>` shell | 63 |
| `page.tsx` | Home page — imports `<HomeView />` | 5 |
| `tree/page.tsx` | Tree page — imports `<TreeView />` | 5 |
| `history/page.tsx` | History page — imports `<HistoryView />` | 5 |
| `error.tsx` | Error boundary with retry button | ~20 |
| `loading.tsx` | Shared loading spinner (`.loading-state`) | ~5 |
| `globals.css` | CSS reset, custom properties, `@layer components` shared classes | ~80 |
| `app-shell.css` | `.app-shell__header`, `__wordmark`, `__main` | ~15 |
| `error.css` | `.error-page`, `__message`, `__retry` | ~10 |

### `src/features/home/` — Session logging

| File | Purpose | LOC |
|------|---------|-----|
| `HomeView.tsx` | Main screen: streak, week progress bar, expandable category cards | 273 |
| `ExerciseForm.tsx` | Per-category workout form with set checkboxes and rep/hold inputs | ~200 |
| `SessionResult.tsx` | Post-save view: completion %, gate status, per-exercise breakdown | ~120 |
| `ChevronIcon.tsx` | Animated expand/collapse SVG arrow | ~15 |
| `useExerciseForm.ts` | Form state management, draft auto-save (500ms debounce), validation | ~150 |
| `home.css` | BEM styles for 6 blocks: home-page, streak-badge, category-row, chevron-icon, exercise-form, session-result | ~200 |
| `index.ts` | Barrel export: `HomeView` | 1 |

### `src/features/tree/` — Skill tree

| File | Purpose | LOC |
|------|---------|-----|
| `TreeView.tsx` | 3×5 grid: columns=categories, rows=levels. NodeBadge per cell, connector lines | 145 |
| `NodeDetail.tsx` | Expanded panel: gate status (dots), exercise targets, close button | ~100 |
| `tree.css` | BEM styles for skill-tree-page + node-detail blocks | ~120 |
| `index.ts` | Barrel export: `TreeView` | 1 |

### `src/features/history/` — Session history

| File | Purpose | LOC |
|------|---------|-----|
| `HistoryView.tsx` | Groups sessions by week, shows streak badge, empty state | 87 |
| `WeekGroup.tsx` | Week header (date range + category dots), session card list | 103 |
| `SessionCard.tsx` | Expandable card: completion %, per-exercise progress bars, notes | 115 |
| `history.css` | BEM styles for history-page, week-group, session-card blocks | ~100 |
| `index.ts` | Barrel export: `HistoryView` | 1 |

### `src/hooks/` — State management

| File | Purpose | LOC |
|------|---------|-----|
| `useGameState.ts` | Central hook: loads all data from storage, provides `logSession`, drafts, streak, gate progress | 384 |

### `src/lib/game/` — Pure game logic

| File | Purpose | LOC |
|------|---------|-----|
| `gate-check.ts` | `getGateCriteria`, `evaluateSession`, `updateGateAfterSession`, `createGateProgress` | 164 |
| `progression.ts` | `getNodeState` (derives visual state from gate), `checkCategoryLevelUp` (mutates user) | 31 |
| `streaks.ts` | `updateStreakOnWeekEnd`, `calculateStreak` (counts consecutive complete weeks) | 28 |
| `week-progress.ts` | `getWeekStart`, `createWeekProgress`, `markCategoryDone`, `isWeekComplete`, `needsWeekReset`, `completedCount` | 65 |

### `src/lib/game/__tests__/` — Test files

| File | Tests |
|------|-------|
| `gate-check.test.ts` | Gate evaluation, clean/dirty sessions, consecutive passes |
| `progression.test.ts` | Node state derivation, level-up detection |
| `streaks.test.ts` | Streak calculation from week histories |
| `week-progress.test.ts` | Week start computation, category marking, reset detection |

### `src/lib/storage/` — Persistence layer

| File | Purpose | LOC |
|------|---------|-----|
| `provider.ts` | `StorageProvider` interface (11 methods) | 23 |
| `netlify-blob.ts` | `NetlifyBlobAdapter`: read-modify-write pattern over `/game/data` endpoint | 106 |
| `index.ts` | Singleton: `getStorage()` / `setStorage()` | 18 |

### `src/lib/` — Utilities

| File | Purpose | LOC |
|------|---------|-----|
| `api-client.ts` | `ApiClient` class: GET/POST/PUT/DELETE with timeout and abort | 103 |
| `constants.ts` | `APP_NAME`, `APP_METADATA`, `LEVEL_NAMES`, `CATEGORY_COLORS` | 71 |
| `session-helpers.ts` | `getGapText` (shortfall description), `getCompletionMessage` (motivational text) | 94 |
| `utils.ts` | `cn()` — clsx + tailwind-merge | ~5 |

### `src/components/` — Shared UI

| File | Purpose |
|------|---------|
| `ui/GlowCard.tsx` + `glow-card.css` | Themed card with colored glow variants (cyan/emerald/push/pull/squat) |
| `ui/ProgressBar.tsx` + `progress-bar.css` | Horizontal progress bar with label, percentage, color variants |
| `ui/SetCheckbox.tsx` + `set-checkbox.css` | Tri-state checkbox: unchecked / met / missed |
| `ui/CategoryBadge.tsx` + `category-badge.css` | Pill badge with category color |
| `ui/NodeBadge.tsx` + `node-badge.css` | Circular badge for skill tree nodes (locked/open/in-progress/passed) |
| `layout/BottomNav.tsx` + `bottom-nav.css` | Fixed bottom tab bar: Home, Tree, History |
| `GatePassedModal.tsx` + `gate-passed-modal.css` | Level-up celebration overlay with glow-burst animation |

### `src/data/` — Static data

| File | Content |
|------|---------|
| `exercises.json` | 30 exercises across 3 categories × 3 levels (levels 1–3 only) |
| `gates.json` | Gate criteria for 3 categories × 3 levels (all require 3 consecutive passes) |

### `src/mocks/` — Development mocking

| File | Purpose |
|------|---------|
| `handlers.ts` | MSW request handlers: in-memory `Map` for `/game/data`, health check |
| `MSWProvider.tsx` | Client component that starts MSW worker when `NEXT_PUBLIC_MSW_ENABLED=true` |
| `browser.ts` | MSW browser worker setup |
| `server.ts` | MSW server setup (for SSR/tests) |
| `data/exercises.ts` | Mock exercise data (legacy format) |
| `data/user.ts` | Mock user data (legacy format) |
| `data/index.ts` | Barrel export for mock data |
| `index.ts` | Barrel export for MSWProvider |

### `src/types/`

| File | Purpose |
|------|---------|
| `index.ts` | All domain types: Category, Exercise, User, WorkoutSession, ExerciseEntry, GateProgress, GateCriteria, WeekProgress, DraftSession |
| `legacy.ts` | PascalCase types for legacy API compatibility |

### `netlify/functions/` — Backend

| File | Endpoint | Purpose |
|------|----------|---------|
| `game-data.ts` | `GET/PUT/DELETE /game/data` | Generic key-value store over Netlify Blobs |
| `health.ts` | `GET /health` | Health check |
| `seed.ts` | `POST /api/seed` | Seed blob store from mock data |
| `export.ts` | `GET /api/export` | Export all blob data as JSON |
| `import.ts` | `POST /api/import` | Import JSON into blob store |
| `core/infrastructure/blob/store.ts` | — | Blob store constants, CORS helpers, store accessors |
| `core/infrastructure/blob/index.ts` | — | Barrel export |

### Config files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, MSW config |
| `tailwind.config.ts` | Tron theme, category colors, glow shadows, fonts |
| `netlify.toml` | Build config, `/api/*` redirect, security headers |
| `tsconfig.json` | TypeScript config with `@/` path alias |
| `vitest.config.ts` | Vitest configuration |
| `postcss.config.js` | PostCSS with Tailwind and autoprefixer |
| `next.config.js` | Next.js config |
| `.eslintrc.json` | ESLint config |

---

## 3. What's Built and Working

### Core game loop (fully functional)
- **Session logging:** User taps a category → form pre-fills from draft or defaults → enters reps/hold per set → checks sets → saves session
- **Gate evaluation:** Each saved session is evaluated against `gates.json` criteria. Clean session (all exercises met) increments `consecutivePasses`. Dirty session resets to 0
- **Level-up:** When `consecutivePasses` reaches `requiredConsecutivePasses` (currently 3 for all gates), the gate status becomes `"passed"`, user level increments by 1, and the `GatePassedModal` fires
- **Week tracking:** Each session marks its category as done for the current week. 3/3 categories = complete week
- **Streak computation:** Consecutive completed weeks (excluding current) are counted oldest→newest. A missed week resets the streak to 0

### Session logging UX
- Draft auto-save with 500ms debounce — user can leave and resume without data loss
- `loadingCatRef` guard prevents stale draft loads when rapidly switching categories
- Only one category can be expanded at a time
- Completed categories are dimmed and non-interactive for the rest of the week
- Post-save result view shows per-exercise breakdown (met/unmet), gap text ("2 reps to go"), completion message, and gate progress dots

### Skill tree
- 3×5 grid visualization (3 categories × 5 levels)
- Node states derived from gate progress: locked, open, in-progress, passed
- Expandable detail panel shows gate status, consecutive pass count, exercise targets
- Connector lines between levels change color based on progression

### History
- All sessions grouped by ISO week (Monday-based)
- Week headers with category completion dots (push=orange, pull=cyan, squat=fuchsia)
- Expandable session cards with per-exercise progress bars
- Streak count displayed in header

### Infrastructure
- `StorageProvider` adapter pattern with `NetlifyBlobAdapter`
- MSW development mocking with in-memory store
- Seed, export, import functions for data management
- Security headers configured in `netlify.toml`
- Self-hosted fonts (zero external requests)
- PWA manifest referenced in layout metadata

### Test coverage
- 45 tests across 4 test files, all passing
- Coverage: gate evaluation logic, progression/level-up, streak calculation, week progress utilities
- All tests target pure functions in `src/lib/game/`

---

## 4. What's NOT Built Yet

### Data gaps
- **Exercises for levels 4–5:** `exercises.json` only has 30 exercises for levels 1–3. The `LEVEL_NAMES` constant defines 5 levels (Beginner through Expert), and the tree grid renders all 5 rows, but levels 4 and 5 have empty nodes
- **Gate criteria for levels 4–5:** `gates.json` only defines criteria for levels 1–3. If a user somehow reached level 4, `getGateCriteria()` would return `null`, and the session would be treated as 100% clean with no real evaluation

### Missing features
- **User authentication:** No auth. User is hardcoded as `{ id: 'default' }`. The default user is created on first `getUser()` call if none exists in storage
- **Multi-user support:** Single-user only. All data keys are global (no user-scoped prefixing)
- **Exercise descriptions/instructions:** Exercise data only has `name`, `category`, `level`, and targets. No form cues, video links, or difficulty descriptions
- **Settings / profile page:** No user settings UI. The `BottomNav` has 3 tabs: Home, Tree, History
- **Notifications / reminders:** No push notifications or reminder system for weekly sessions
- **Offline support:** MSW mocking works in dev, but there's no service worker or offline cache for production. The `manifest.json` is referenced but not verified to exist
- **Analytics / progress charts:** History shows raw session cards but no trend charts, PR tracking, or volume graphs
- **Social features:** No sharing, leaderboards, or community features
- **Exercise customization:** Users can't add custom exercises or modify targets
- **Rest timer:** No built-in rest timer between sets
- **Onboarding flow:** No first-run experience. New users land on the home page with all categories at Level 1

### Backend gaps
- **Auth on seed/import/export:** Functions have TODO comments noting auth checks are needed before production
- **CORS configuration:** `corsHeaders` in `store.ts` uses `Access-Control-Allow-Origin: *` — needs explicit origin restriction for production
- **Structured logging:** TODO at `netlify-blob.ts:15` — errors are `console.warn` only
- **Rate limiting:** No rate limiting on any endpoint
- **Data validation:** No schema validation on PUT `/game/data` — any JSON value is accepted

---

## 5. Known Issues & Tech Debt

### Active issues

1. **ESLint config failure.** `@typescript-eslint/recommended` fails to load (pre-existing). Does not block builds, but `npm run lint` may show configuration errors.

2. **`saveSession` read-modify-write race.** `NetlifyBlobAdapter.saveSession()` reads all sessions, appends, and writes back. Two concurrent saves could lose data:
   ```typescript
   // netlify-blob.ts:27-30
   async saveSession(session: WorkoutSession): Promise<void> {
     const sessions = await this.getSessions()
     sessions.push(session)
     await this.set('sessions', sessions)
   }
   ```
   Same pattern applies to `updateGateProgress` and `updateWeekProgress`. Not an issue for a single-user single-tab app, but would be if the architecture scaled.

3. **`checkCategoryLevelUp` mutates its input.** The function mutates `user.levels` directly. `useGameState` works around this by shallow-cloning the user before passing it in:
   ```typescript
   // useGameState.ts:259-262
   const userCopy: User = {
     ...user,
     levels: { ...user.levels },
   }
   leveledUp = checkCategoryLevelUp(updatedGate, userCopy)
   ```

4. **No test coverage for UI components, hooks, or storage adapter.** All 45 tests are on pure game logic functions. The `useGameState` hook, `NetlifyBlobAdapter`, and all React components are untested.

5. **Legacy mock data files.** `src/mocks/data/exercises.ts` and `src/mocks/data/user.ts` use a different data shape (PascalCase categories, different structure) than the current type system. They're only used by the `seed.ts` function.

6. **Unused shadcn primitives.** `class-variance-authority` and `@radix-ui/react-slot` are in `dependencies`. shadcn component files (`badge.tsx`, `button.tsx`, `card.tsx`) may still exist but are not imported by any feature code. These components use a CVA pattern that's different from the BEM convention.

7. **`api.user.getUserData()` swallows errors.** The adapter's `get()` method catches all errors and returns `null`, making it impossible to distinguish "no data" from "network failure":
   ```typescript
   // netlify-blob.ts:14-18
   } catch (err) {
     console.warn('[NetlifyBlobAdapter] get failed for key:', key, err)
     return null
   }
   ```

### Code smells (non-blocking)

- `APP_NAME` in `constants.ts` says `'Contrl'` but `layout.tsx` metadata says `'contrl'` (lowercase). The wordmark in the header renders lowercase `'contrl'`.
- `backup.json` and `snapshot.json` at project root are checked-in data dumps with no documentation on their purpose.
- `test-integration.js` at project root — purpose unclear, may be a one-off script.
- `types/legacy.ts` exists for API compatibility but may no longer be needed given the current architecture.

---

## 6. Data Model Snapshot

### Core types (from `src/types/index.ts`)

```typescript
type Category = 'push' | 'pull' | 'squat'

type Exercise = {
  id: string               // "push-1-pushups"
  name: string             // "Wall Push-ups"
  category: Category
  level: number            // 1–5
  targetSets: number
  targetReps: number
  isHold: boolean
  targetHoldSeconds?: number
}

type User = {
  id: string               // "default"
  levels: Record<Category, number>  // { push: 1, pull: 1, squat: 1 }
  createdAt: string
}

type WorkoutSession = {
  id: string               // "push-2-1709312000000"
  date: string             // ISO 8601
  level: number
  category: Category
  exercises: ExerciseEntry[]
  notes?: string
}

type ExerciseEntry = {
  exerciseId: string
  targetSets: number
  targetReps: number
  actualSets: number
  actualReps: number[]
  actualHoldSeconds?: number[]
  checkedSets: boolean[]
  hitTarget: boolean
}

type GateProgress = {
  level: number
  category: Category
  status: 'locked' | 'in-progress' | 'passed'
  consecutivePasses: number   // 0–3
  lastSessionDate?: string
}

type GateCriteria = {
  requiredConsecutivePasses: number  // always 3
  exercises: GateCriteriaExercise[]
}

type WeekProgress = {
  weekStart: string          // "2025-03-03" (Monday)
  sessionsCompleted: Record<Category, boolean>
}

type DraftSession = {
  category: Category
  level: number
  exercises: ExerciseFormState[]
  notes: string
  savedAt: string
}
```

### Static data volumes

| Data file | Records | Coverage |
|-----------|---------|----------|
| `exercises.json` | 30 exercises | 3 categories × 3 levels (10 per category) |
| `gates.json` | 9 gate criteria sets | 3 categories × 3 levels |

### Blob storage keys

All data is stored as flat key-value pairs via the `/game/data` endpoint:

| Key | Shape | Description |
|-----|-------|-------------|
| `sessions` | `WorkoutSession[]` | All logged sessions (append-only) |
| `gate-progress` | `Record<"cat:level", GateProgress>` | Gate state per category/level |
| `week-progress` | `Record<weekStart, WeekProgress>` | Per-week completion tracking |
| `user` | `User` | Single user profile |
| `draft:push:1` | `DraftSession \| null` | Auto-saved draft per category/level |

---

## 7. API / Endpoint Surface

### Netlify Functions

All endpoints are accessed via `/api/*` which redirects to `/.netlify/functions/:splat` (configured in `netlify.toml`).

#### `GET /game/data?key=<key>`
Read a value from the game data blob store.

**Response:** Raw JSON value for the key, or `null` if not found.

#### `PUT /game/data`
Write a value to the game data blob store.

**Request body:**
```json
{ "key": "sessions", "value": [...] }
```

**Response:** `{ "success": true }`

#### `DELETE /game/data?key=<key>`
Delete a key from the game data blob store.

#### `GET /health`
Health check.

**Response:** `{ "status": "ok", "timestamp": "...", "mock": false }`

#### `POST /api/seed`
Seed blob store from mock data. Accepts optional `?only=user` or `?only=exercises`.

#### `GET /api/export`
Export all blob data as JSON.

#### `POST /api/import`
Import JSON into blob store. Body: `{ "data": { "userData": ..., "workoutLevels": ... } }`

### Client-side API flow

```
UI component
  → useGameState()
    → getStorage() → NetlifyBlobAdapter
      → apiClient.get('/game/data', { key })
        → fetch('/api/game/data?key=sessions')
          → Netlify Function: game-data.ts
            → gameDataStore.get('sessions')
              → @netlify/blobs
```

In development with MSW enabled, the fetch is intercepted by `handlers.ts` and served from an in-memory `Map`.

---

## 8. State Management Map

### React state ownership

There is no state management library. All state lives in React hooks.

```
useGameState() ← single source of truth
├── status: GameStateStatus        ('loading' | 'ready' | 'error')
├── user: User | null
├── weekProgress: WeekProgress | null
├── streak: number
├── gateProgress: Record<string, GateProgress>
├── sessions: WorkoutSession[]
├── categoryDoneThisWeek: Record<Category, boolean>  (derived)
├── weekComplete: boolean                              (derived)
├── completedThisWeek: number                          (derived)
├── logSession(session) → LogSessionResult
├── getGateForCategory(cat) → GateProgress | null
├── saveDraft(draft) → void
├── loadDraft(cat, level) → DraftSession | null
└── reload() → void
```

### Feature-level state

| Feature | Local state | Owner |
|---------|-------------|-------|
| HomeView | `expandedCategory`, `activeDraft`, `result`, `saving`, `saveError`, `levelUpInfo`, `loadingCatRef` | HomeView component |
| ExerciseForm | `exercises` (per-exercise form arrays), `notes`, `saveTimerRef` | useExerciseForm hook |
| TreeView | `expandedNode` | TreeView component |
| SessionCard | `expanded` | SessionCard component |

### Data flow for logging a session

```
1. User taps category card
   HomeView.handleToggleCategory()
   → loadDraft(cat, level)        ← useGameState
   → setActiveDraft(draft)        ← local state
   → setExpandedCategory(cat)     ← local state

2. User fills in form
   useExerciseForm manages local arrays
   → 500ms debounce → saveDraft() ← useGameState → storage

3. User taps "Save Session"
   HomeView.handleSave(session)
   → logSession(session)          ← useGameState
     → storage.saveSession()
     → evaluateSession() against gates.json
     → updateGateAfterSession()
     → storage.updateGateProgress()
     → checkCategoryLevelUp()
     → storage.updateUser() (if leveled up)
     → markCategoryDone()
     → storage.updateWeekProgress()
     → storage.clearDraft()
   → setResult(LogSessionResult)  ← local state

4. Result displayed
   SessionResult renders completion %, gap text, gate dots
   If leveledUp → GatePassedModal shown

5. User taps "Done"
   → setExpandedCategory(null)    ← local state
```

---

## 9. Ready-for-Next-Phase Checklist

| Item | Status | Notes |
|------|--------|-------|
| Game loop works end-to-end | Yes | Log → evaluate → gate → level-up → week → streak |
| All pure logic tested | Yes | 45/45 tests passing in `lib/game/` |
| TypeScript strict mode | Yes | `tsc --noEmit` clean |
| Production build succeeds | Yes | `npm run build` passes |
| BEM CSS extraction complete | Yes | All components use BEM `.css` files |
| Feature-first directory structure | Yes | `features/home`, `features/tree`, `features/history` |
| Pages are thin wrappers | Yes | All 3 page files are 5 LOC |
| Single gateway hook | Yes | `useGameState` is the only data access point |
| Storage adapter pattern | Yes | Swappable via `setStorage()` |
| Level 4–5 exercise data | No | `exercises.json` and `gates.json` only cover levels 1–3 |
| Authentication | No | Single hardcoded user (`id: 'default'`) |
| Production CORS | No | Currently `Access-Control-Allow-Origin: *` |
| Auth on admin endpoints | No | seed/import/export have no access control |
| UI component tests | No | Only pure logic is tested |
| Offline/PWA support | No | Manifest referenced but no service worker |
| Error recovery | Partial | `get()` swallows errors; UI shows generic "Failed to load" |

---

## 10. Extension Points

### Adding exercises for levels 4–5

1. Add exercise entries to `src/data/exercises.json` with `level: 4` and `level: 5`
2. Add gate criteria entries to `src/data/gates.json` under keys `"4"` and `"5"` for each category
3. No code changes needed — the tree grid already renders 5 rows, `getGateCriteria()` already looks up by level, and `evaluateSession()` already handles arbitrary exercise lists

### Swapping the storage backend

Implement the `StorageProvider` interface (`src/lib/storage/provider.ts`) and call `setStorage(new YourAdapter())` before any component mounts. The interface has 11 methods covering sessions, gates, weeks, users, and drafts.

```typescript
export interface StorageProvider {
  saveSession(session: WorkoutSession): Promise<void>
  getSessions(category?: string, level?: number): Promise<WorkoutSession[]>
  getGateProgress(level: number, category: string): Promise<GateProgress>
  updateGateProgress(gate: GateProgress): Promise<void>
  getWeekProgress(weekStart: string): Promise<WeekProgress>
  updateWeekProgress(week: WeekProgress): Promise<void>
  getUser(): Promise<User>
  updateUser(user: User): Promise<void>
  saveDraft(draft: DraftSession): Promise<void>
  getDraft(category: Category, level: number): Promise<DraftSession | null>
  clearDraft(category: Category, level: number): Promise<void>
}
```

### Adding a new category

1. Add the category string to the `Category` type union in `src/types/index.ts`
2. Add it to the `CATEGORIES` array
3. Add exercises and gate criteria for the new category in the JSON data files
4. Add a color entry in `CATEGORY_COLORS` (`constants.ts`) and corresponding Tailwind config entries (`cat-newcat` color, `glow-newcat` shadow)
5. Add BEM modifier classes (`--newcat`) in the relevant CSS files (category-badge, glow-card, week-group dots)
6. `weekProgress.sessionsCompleted` needs the new key — existing stored data will need migration or a default fallback

### Adding a new page/feature

1. Create `src/features/yourfeature/YourView.tsx` with `'use client'` directive
2. Create `src/app/yourroute/page.tsx` as a thin wrapper importing `<YourView />`
3. Add a tab to `src/components/layout/BottomNav.tsx`
4. If it needs game state, destructure from `useGameState()` — don't access storage directly

### Tailwind theme reference

The design system uses these token prefixes:
- `tron-*` for base theme (bg, surface, primary, success, warning, muted, danger, text, border)
- `cat-*` for category accents (cat-push: orange, cat-pull: cyan, cat-squat: fuchsia)
- `glow-*` for box-shadow utilities (glow-cyan, glow-emerald, glow-push, etc.)
- Font families: `font-display` (Chakra Petch), `font-mono` (Share Tech Mono)
