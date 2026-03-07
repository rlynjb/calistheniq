# Frontend Standards

This project uses Next.js, React.

## Component Architecture
- Use Server Components by default, `"use client"` only when needed
- Keep components focused on a single responsibility
- Extract shared logic into custom hooks

## Routing
- File-based routing with App Router
- Use layout.tsx for persistent UI
- Use loading.tsx and error.tsx for UX

## Data Fetching
- Fetch data in Server Components when possible
- Use SWR or TanStack Query for client-side real-time data
