# Deployment

## Build & Deploy

CalisthenIQ deploys to Netlify. Pushing to `main` triggers an automatic build.

### Build Command

Defined in `netlify.toml`:

```toml
[build]
  command = "npm run build"     # runs: next build
  functions = "netlify/functions"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### URL Routing

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

All `/api/exercises`, `/api/user-data`, etc. are rewritten to `/.netlify/functions/exercises`, `/.netlify/functions/user-data`, etc.

### Security Headers

Applied to all routes via `netlify.toml`:

```
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Environment Variables

### Actually Used by Code

| Variable | Used in | Default | Description |
|----------|---------|---------|-------------|
| `NEXT_PUBLIC_MSW_ENABLED` | `src/mocks/MSWProvider.tsx` | — | Set `true` to enable in-browser API mocking (dev only) |
| `NEXT_PUBLIC_API_BASE_URL` | `src/api/client.ts` | `''` (relative) | Base URL for API requests |
| `NEXT_PUBLIC_API_TIMEOUT` | `src/api/client.ts` | `10000` | Request timeout in ms |

### Not Used by Any Code (Dead Variables)

The following exist in `.env.local` and `.env.local.example` but are **not imported or referenced** by any TypeScript file:

| Variable | Intended for | Status |
|----------|-------------|--------|
| `OPENAI_API_KEY` | OpenAI integration | Never integrated |
| `OPENAI_ORGANIZATION_ID` | OpenAI integration | Never integrated |
| `DATABASE_URL` | Neon Postgres | Never integrated (blobs used instead) |
| `DIRECT_URL` | Neon Postgres | Never integrated |
| `NEXTAUTH_SECRET` | NextAuth.js | Never integrated |
| `NEXTAUTH_URL` | NextAuth.js | Never integrated |
| `NEXT_PUBLIC_APP_URL` | — | Not referenced |
| `NEXT_PUBLIC_EXERCISE_SOURCE` | — | Not referenced |
| `NEXT_PUBLIC_USER_PROGRESS_SOURCE` | — | Not referenced |
| `NETLIFY_SITE_ID` | Netlify CLI | Used implicitly by CLI, not by app code |
| `NETLIFY_AUTH_TOKEN` | Netlify CLI | Used implicitly by CLI, not by app code |

### Recommended `.env.local` (Minimal)

```env
NEXT_PUBLIC_MSW_ENABLED=true
```

That's all that's needed for local development with MSW. For local blob storage mode:

```env
NEXT_PUBLIC_MSW_ENABLED=false
NEXT_PUBLIC_API_BASE_URL=
```

## Dead `package.json` Scripts

The following scripts reference files that **do not exist** (`netlify/functions/core/infrastructure/database/` directory is absent):

```json
"db:setup": "tsx netlify/functions/core/infrastructure/database/seed.ts",
"db:migrate": "tsx netlify/functions/core/infrastructure/database/migrate.ts",
"db:seed": "tsx netlify/functions/core/infrastructure/database/seed-exercises.ts && ...",
"db:test": "tsx netlify/functions/core/infrastructure/database/test-connection.ts",
"db:verify": "tsx netlify/functions/core/infrastructure/database/verify.ts",
"db:test-queries": "tsx netlify/functions/core/infrastructure/database/test-queries.ts"
```

These can be removed from `package.json`.

## Deploy Checklist

1. Ensure `NEXT_PUBLIC_MSW_ENABLED` is **not** set in Netlify environment variables (MSW only runs in dev)
2. Verify blob storage has data: `curl https://your-site.netlify.app/api/export`
3. If blobs are empty, seed from local: export local → import to production (see [DATA_LIFECYCLE.md](DATA_LIFECYCLE.md))
4. Build passes locally: `npm run build`
