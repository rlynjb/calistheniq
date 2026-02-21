# Architecture

## System Diagram

```
Browser
├── Next.js 14 (App Router)
│   ├── / ─────────────── DashboardPage → WeeklyProgress
│   └── /workout-levels ─ WorkoutLevelsPage → WorkoutLevels
│
├── useUserData hook ──── central state + write queue
│
├── src/api/ ─────────── API client (fetch wrapper)
│   │
│   ├── MSW enabled? ──→ In-browser mocks (src/mocks/)
│   └── MSW disabled? ─→ fetch /api/* ──→ Netlify redirect
│                                          /.netlify/functions/*
Netlify Functions (10)
├── exercises, exercises-levels,
│   exercises-level, exercises-search ──→ reads from mock imports + blob cache
├── user-data, user-levels ─────────────→ reads/writes Netlify Blobs
├── health ─────────────────────────────→ status check
└── seed, export, import ───────────────→ blob data management
         │
    Netlify Blobs
    ├── store: "user-data"  key: "user-progress"
    └── store: "exercises"  key: "workout-levels"
```

## Frontend

### Pages

| Route | File | Renders |
|-------|------|---------|
| `/` | `src/app/page.tsx` | `ProgressPanel` → `WeeklyProgress` |
| `/workout-levels` | `src/app/workout-levels/page.tsx` | `WorkoutLevels` |

`ChatInterface` exists at `src/components/chat/ChatInterface.tsx` but is commented out in `page.tsx`.

### Component Tree (Dashboard)

```
DashboardPage
└── ProgressPanel
    └── WeeklyProgress          ← consumes useUserData()
        ├── 7-day calendar grid
        └── Modal
            └── WorkoutDetail   ← receives mutation callbacks as props
                └── WorkoutExerciseCard[]  ← uncontrolled after mount
```

### State Management: `useUserData` Hook

Source: `src/hooks/useUserData.ts`

Single hook owns all user state. No external state library.

**Returned state:**
- `userData` — raw `UserData` from API
- `currentLevels` — `{ Push: number, Pull: number, Squat: number }`
- `weekDays` — 7-element `ExtendedWeekDay[]` (generated week merged with `weeklyProgress`)
- `status` — `'idle' | 'loading' | 'error' | 'success'`
- `saveStatus` — `'idle' | 'saving' | 'saved' | 'error'`

**Returned mutations:**
- `addCategoryToDay(date, category, exercises, level)` — async, optimistic
- `removeCategoryFromDay(date, category)` — async, optimistic
- `updateExercise(date, index, exercise)` — **sync** (debounced 600ms before API call)
- `levelUp(category, newLevel)` — async
- `refreshAll()` — re-fetches everything from API

### Key Technical Decisions

**Write queue (promise-based mutex)**
All async mutations are serialized via `writeQueueRef.current = writeQueueRef.current.then(fn)`. This prevents concurrent read-modify-write races when the user rapidly toggles checkboxes or adds categories.

**Optimistic updates**
Every mutation updates `weekDays` state immediately via `setWeekDays(prev => ...)` before the API call. On API failure, `refreshAll()` reverts to server truth.

**Debounced exercise saves**
`updateExercise` updates local state synchronously, stores the pending change in `pendingExerciseRef`, and resets a 600ms timer. Only when the timer fires does `flushExerciseUpdate()` enqueue the API call. This batches rapid edits (reps, checkboxes) into a single network round-trip.

**Derived `selectedDay`**
`WeeklyProgress` stores `selectedDayDate: string | null` and derives the actual `selectedDay` object via `useMemo(() => weekDays.find(...), [weekDays, selectedDayDate])`. This avoids stale closures — when a mutation updates `weekDays`, the derived value automatically reflects the change.

**Uncontrolled-after-mount `WorkoutExerciseCard`**
The card initializes local state from props and never syncs back from props. The parent uses React `key={exercise.name-index}` to force a remount when exercise identity changes. This prevents `useEffect` state resets from overwriting in-progress user input.

### API Client

Source: `src/api/client.ts`

`ApiClient` class wrapping `fetch` with:
- Configurable base URL (`NEXT_PUBLIC_API_BASE_URL`, default `''`)
- Configurable timeout (`NEXT_PUBLIC_API_TIMEOUT`, default `10000`)
- `AbortController` per request
- Methods: `get`, `post`, `put`, `delete`
- Returns `ApiResponse<T>` with `{ data, success, message?, error? }`
- Throws `ApiError` with `{ message, status?, code? }`

### MSW Integration

Source: `src/mocks/MSWProvider.tsx`, `src/mocks/handlers.ts`

`MSWProvider` wraps the app in `layout.tsx`. On mount, if `NODE_ENV === 'development'` and `NEXT_PUBLIC_MSW_ENABLED === 'true'`, it starts the MSW service worker. The worker intercepts all `fetch` calls matching `*/exercises/*`, `*/user/*`, and `*/health` patterns.

MSW handlers mirror the exact logic of the Netlify Functions (same filtering, same response shapes) using in-memory state initialized from `src/mocks/data/`.

## Backend

### Blob Storage Abstraction

Source: `netlify/functions/core/infrastructure/blob/store.ts`

Two stores, two keys:

| Store name | Key | Contents |
|------------|-----|----------|
| `user-data` | `user-progress` | `UserData` (levels + weeklyProgress) |
| `exercises` | `workout-levels` | `WorkoutLevels` (exercises by difficulty) |

Wrapper functions: `userDataStore.get()`, `userDataStore.set()`, `exerciseDataStore.getWorkoutLevels()`, etc.

Also exports shared response helpers: `jsonResponse()`, `errorResponse()`, `handleCors()`.

### Exercise Functions Data Source

The 4 exercise functions (`exercises.ts`, `exercises-search.ts`, `exercises-level.ts`) import `allExercises` directly from `src/mocks/data/exercises.ts` at **bundle time**. They do not read from blob storage. `exercises-levels.ts` tries blob first, falls back to the imported `workoutLevels`.

### CORS

All functions handle `OPTIONS` preflight and return `Access-Control-Allow-Origin: *` on every response via the shared `corsHeaders` object.

## Installed but Unused Dependencies

| Package | Intended use | Status |
|---------|-------------|--------|
| `@openai/agents`, `openai` | AI coaching agents | Not imported by any `.ts` file |
| `@neondatabase/serverless`, `pg` | Postgres database | Not imported; blob storage is used instead |
| `zod` | Schema validation | Not imported |
| `dotenv` | Env loading | Not imported (Next.js handles this) |

The `db:*` scripts in `package.json` reference `netlify/functions/core/infrastructure/database/` which **does not exist**. These scripts are dead.
