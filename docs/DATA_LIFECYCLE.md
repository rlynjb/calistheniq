# Data Lifecycle

## 1. Environments

| Environment       | Blob location                  | URL              | Config difference                                        |
| ----------------- | ------------------------------ | ---------------- | -------------------------------------------------------- |
| **Local (MSW)**   | N/A (in-browser memory)        | `localhost:3000` | `NEXT_PUBLIC_MSW_ENABLED=true` — no backend needed       |
| **Local (Blobs)** | `.netlify/blobs/` (filesystem) | `localhost:8888` | `NEXT_PUBLIC_MSW_ENABLED=false` — requires `netlify dev` |
| **Production**    | Netlify cloud blob storage     | `*.netlify.app`  | MSW not loaded (`NODE_ENV !== 'development'`)            |

Local blobs and production blobs are **completely separate** stores. Changes in one do not affect the other.

## 2. Data Sources

### Primary: Netlify Blobs

Two blob stores hold all persistent data:

| Store       | Key              | Shape                                                   |
| ----------- | ---------------- | ------------------------------------------------------- |
| `user-data` | `user-progress`  | `UserData` — levels, weeklyProgress, lastUpdated        |
| `exercises` | `workout-levels` | `WorkoutLevels` — exercises grouped by difficulty level |

Source: `netlify/functions/core/infrastructure/blob/store.ts`

### Fixtures: Mock Data Files

| File                          | Exports                                        | Used by                                                                   |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `src/mocks/data/exercises.ts` | `workoutLevels`, `allExercises`                | MSW handlers, `seed` function, exercise functions (bundled at build time) |
| `src/mocks/data/user.ts`      | `MOCK_CurrentUserLevel`, `MOCK_weeklyWorkouts` | MSW handlers, `seed` function                                             |

These files are the **source of truth for exercise definitions**. The `seed` function pushes them into blob storage.

## 3. Entity Lifecycle

### UserData

```
Shape: {
  currentLevels: { Push: number, Pull: number, Squat: number }
  weeklyProgress: WorkoutSession[]
  lastUpdated: string (ISO)
}
```

**Create:** First `GET /api/user-data` returns `DEFAULT_USER_DATA` (`{ Push: 0, Pull: 0, Squat: 0 }`) if blob is empty.
No explicit user creation — default is returned on first read.

**Read:** `useUserData` hook calls `api.user.getUserData()` on mount. The client function swallows errors and returns `null`. The function also cleans up sessions dated beyond the current week's Saturday.

**Update (weeklyProgress):** When a user adds a category or edits an exercise:

1. `useUserData` optimistically updates `weekDays` state (instant UI)
2. Mutation is enqueued in the write queue
3. Inside the queue: fetch latest from API → merge change → `PUT /api/user-data` → reconcile response into state
4. On failure: `refreshAll()` reverts to server truth

**Update (levels):** `PUT /api/user-levels` with `{ category, level }`. Reads existing blob, patches the category, writes back.

**Delete:** No delete operation exists. Stale weekly sessions are pruned on read (sessions beyond Saturday are filtered out by `user-data.ts`).

### Exercises (WorkoutLevels)

**Create:** `POST /api/exercises` accepts a body but does **not persist** — returns `{ success: true, exercise: body }` without writing to storage. This endpoint is a stub.

**Read:** `GET /api/exercises-levels` checks blob storage first. If empty, falls back to the imported `workoutLevels` from mock data and caches it in the blob.

The other exercise endpoints (`exercises`, `exercises-search`, `exercises-level`) read directly from `allExercises` imported at bundle time. They do not read from blob storage.

**Update:** Only via the `seed` function (`POST /api/seed`), which overwrites the blob with current mock file data.

**Delete:** No delete operation.

## 4. Data Flow

### Runtime (production)

```
User interaction
  → useUserData hook (optimistic state update)
  → write queue serializes mutation
  → GET /api/user-data (read latest from blob)
  → merge change
  → PUT /api/user-data (write to blob)
  → reconcile response into React state
```

### Runtime (MSW dev mode)

```
User interaction
  → useUserData hook (optimistic state update)
  → write queue serializes mutation
  → MSW intercepts fetch (in-memory JS object)
  → returns updated data
  → reconcile response into React state
```

No network requests leave the browser in MSW mode.

### Data Management (seed / export / import)

```
Fixtures (src/mocks/data/)
       ↓ POST /api/seed
Blob Storage
       ↓ GET /api/export
backup.json (snapshot)
       ↓ POST /api/import
Blob Storage (any environment)
```

**Sync production → local:**

```bash
curl https://your-site.netlify.app/api/export > backup.json
curl -X POST http://localhost:8888/api/import -d @backup.json -H "Content-Type: application/json"
```

**Sync local → production:**

```bash
curl http://localhost:8888/api/export > backup.json
curl -X POST https://your-site.netlify.app/api/import -d @backup.json -H "Content-Type: application/json"
```

**Pull blob data into mock files:**

```bash
npm run sync:from-blob          # from local blob
npm run sync:from-prod -- --url https://your-site.netlify.app   # from production
```

Source: `scripts/sync-from-blob.ts`. Overwrites `src/mocks/data/user.ts` with generated code.

### Background Jobs

None. There are no scheduled tasks or background functions.

## 5. Schema Changes

There is no migration system. Blob storage is schemaless JSON.

To change the `UserData` shape:

1. Update the TypeScript interfaces in `src/api/user.ts`
2. Update the matching interface in `netlify/functions/user-data.ts` and `netlify/functions/user-levels.ts`
3. Update the MSW handler in `src/mocks/handlers.ts`
4. Update mock data files in `src/mocks/data/`
5. Re-seed local blobs: `curl -X POST http://localhost:8888/api/seed`
6. For production: export current data, transform offline, re-import

There is no automated migration. Existing blob data must be compatible with the new shape, or manually transformed via export → edit → import.

## 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐                                                          │
│   │  Mock Files  │  (Fixtures — source of truth, version controlled)        │
│   │  src/mocks/  │                                                          │
│   │  data/       │                                                          │
│   └──────┬───────┘                                                          │
│          │                                                                   │
│          │  curl -X POST http://localhost:8888/api/seed                      │
│          │  Source: netlify/functions/seed.ts                                │
│          ▼                                                                   │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│   │    LOCAL     │         │              │         │  PRODUCTION  │        │
│   │  Blob Store  │────────▶│  backup.json │────────▶│  Blob Store  │        │
│   │              │ curl    │  (snapshot)  │ curl -X │              │        │
│   │  .netlify/   │ :8888/  │              │ POST    │  Netlify     │        │
│   │  blobs/      │ api/    │              │ $PROD/  │  cloud       │        │
│   │              │ export  │              │ api/    │  blobs       │        │
│   │              │ >backup │              │ import  │              │        │
│   │              │ .json   │              │ -d @..  │              │        │
│   │              │◄────────│              │◄────────│              │        │
│   └──────┬───────┘ curl -X └──────────────┘ curl    └──────┬───────┘        │
│          │         POST                     $PROD/         │                │
│          │         :8888/                   api/            │                │
│          │         api/                     export          │                │
│          │         import                   >backup         │                │
│          │         -d @..                   .json           │                │
│          │                                                  │                │
│          │  netlify dev (:8888)                              │  *.netlify    │
│          ▼                                                  ▼  .app         │
│   ┌──────────────┐                                  ┌──────────────┐        │
│   │  Local App   │                                  │  Prod App    │        │
│   │  Next.js +   │                                  │  Next.js +   │        │
│   │  Functions   │                                  │  Functions   │        │
│   └──────────────┘                                  └──────────────┘        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │  Reverse sync (blob → mock files):                              │       │
│   │  npm run sync:from-blob          (local blob → src/mocks/data/)│       │
│   │  npm run sync:from-prod -- --url $PROD    (prod → src/mocks/)  │       │
│   │  Source: package.json → scripts/sync-from-blob.ts              │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

No external services. No auth, AI, payments, or third-party APIs. The 4 exercise functions read from bundled mock data at build time — only `exercises-levels` reads from blob storage (with fallback to bundled data).

## 7. Data Sync Commands

Every command below is verified in the codebase. Server must be running for all curl commands.

### Seed local blobs from fixtures

Pushes `src/mocks/data/` into local blob storage. **Overwrites existing blob data.**

```bash
curl -X POST http://localhost:8888/api/seed                   # all data
curl -X POST "http://localhost:8888/api/seed?only=exercises"   # exercises only
curl -X POST "http://localhost:8888/api/seed?only=user"        # user data only
```

Source: `netlify/functions/seed.ts`. Imports from `src/mocks/data/` at bundle time.

### Export blob → snapshot

```bash
curl http://localhost:8888/api/export > backup.json            # local
curl https://your-site.netlify.app/api/export > backup.json    # production
```

Source: `netlify/functions/export.ts`. Output format: `{ success, exportedAt, data: { userData, workoutLevels } }`.

### Import snapshot → blob

**Overwrites target blob data. No confirmation prompt. No auth required.**

```bash
# local → production
curl http://localhost:8888/api/export > backup.json
curl -X POST https://your-site.netlify.app/api/import \
  -d @backup.json -H "Content-Type: application/json"

# production → local
curl https://your-site.netlify.app/api/export > backup.json
curl -X POST http://localhost:8888/api/import \
  -d @backup.json -H "Content-Type: application/json"
```

Source: `netlify/functions/import.ts`. Validates `body.data` exists. Accepts partial imports (userData only or workoutLevels only).

### Reverse sync: blob → mock files

Pulls blob data back into `src/mocks/data/user.ts` (overwrites the file with generated code).

```bash
npm run sync:from-blob                                         # from local blob
npm run sync:from-prod -- --url https://your-site.netlify.app  # from production
```

Source: `package.json` → `scripts/sync-from-blob.ts`. Only syncs user data — does not sync exercises.

### Safety notes

- **Import overwrites** — no merge, no diff, no undo. Export a backup first.
- **No auth** — all endpoints are publicly accessible. No admin key required.
- **No migrations** — blob storage is schemaless JSON. Shape changes require manual transforms.
- **Seed is bundled** — mock data is imported at function build time. Changing `src/mocks/data/` requires restarting `netlify dev` or `netlify functions:serve`.
