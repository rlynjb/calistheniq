# Contrl

Calisthenics workout tracker. Users log weekly workouts across Push, Pull, and Squat categories with 5 progressive difficulty levels.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Netlify Functions (serverless) |
| Storage | Netlify Blobs (key-value) |
| Dev mocking | MSW 2.x (Mock Service Worker) |

## Quick Start

```bash
# Prerequisites: Node >= 18, Netlify CLI
npm install

# Full local stack (recommended)
netlify dev                  # Next.js + Functions on :8888

# Or split processes
npm run dev                  # Next.js on :3000
netlify functions:serve      # Functions on :9999
```

### Seed Data

With the server running:

```bash
curl -X POST http://localhost:8888/api/seed                   # all data
curl -X POST "http://localhost:8888/api/seed?only=exercises"   # exercises only
curl -X POST "http://localhost:8888/api/seed?only=user"        # user data only
```

## Dev Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server (:3000) |
| `npm run build` | Production build (`next build`) |
| `npm run type-check` | TypeScript checking (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `netlify dev` | Full local stack (:8888) |
| `npm run sync:from-blob` | Pull blob data into `src/mocks/data/` files |
| `npm run sync:from-prod` | Pull production blob data into mock files |

## Documentation

| Doc | Contents |
|-----|----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, state management, key decisions |
| [DATA_LIFECYCLE.md](docs/DATA_LIFECYCLE.md) | How data flows through environments |
| [API.md](docs/API.md) | All routes, contracts, validation, examples |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Environment variables, Netlify config, build process |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and debugging steps |

## License

MIT
