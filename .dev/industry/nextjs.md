# Next.js Best Practices

## App Router
- Use the App Router (`app/` directory) for new projects
- Organize routes with route groups `(group)` for shared layouts
- Use `layout.tsx` for persistent UI across route segments
- Use `loading.tsx` for route-level loading states
- Use `error.tsx` for route-level error boundaries
- Keep page components thin — delegate to feature components

## Data Fetching
- Fetch data in Server Components by default — no `useEffect` needed
- Use `fetch` with caching options for server-side data
- Deduplicate requests — Next.js automatically dedupes `fetch` calls
- Use `generateStaticParams` for static generation of dynamic routes
- Prefer server-side data fetching over client-side for SEO-critical pages
- Use SWR or TanStack Query for client-side data that needs real-time updates

## API Routes
- Use Route Handlers (`route.ts`) in the App Router
- Validate request bodies before processing
- Return consistent error shapes: `{ error: string }`
- Use appropriate HTTP status codes (400, 401, 404, 500)
- Add rate limiting for public endpoints
- Never expose secrets in client-side code

## Performance
- Use `next/image` for automatic image optimization
- Use `next/font` for self-hosted fonts with zero layout shift
- Minimize client-side JavaScript — prefer Server Components
- Use dynamic imports for heavy client-side libraries
- Configure `headers()` for proper cache-control
- Use `generateMetadata` for SEO metadata

## Deployment
- Use environment variables for configuration (`.env.local` for dev)
- Set up CI/CD with automated type-checking and linting
- Configure `output: 'standalone'` for containerized deployments
- Use ISR (Incremental Static Regeneration) for semi-static content
- Monitor Core Web Vitals in production
- Test with `next build && next start` before deploying
