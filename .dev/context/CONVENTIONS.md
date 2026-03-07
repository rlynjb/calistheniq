# Coding Conventions

## TypeScript
- Use strict TypeScript — avoid `any`, prefer `unknown` for untyped values
- Define return types for public API functions
- Use discriminated unions for state variants

## React
- Prefer function components with hooks
- Use named exports for components
- Co-locate component files (tsx, css, test)
- Extract reusable logic into custom hooks

## CSS / Styling
- Use `@apply` in co-located CSS files with BEM naming
- Use `@reference` for Tailwind class resolution in co-located CSS
- Group classes: layout → spacing → color → typography

## Next.js
- Use App Router patterns: layout.tsx, loading.tsx, error.tsx
- Fetch data in Server Components when possible
- Use route groups for shared layouts
