# CSS / Styling Standards

This project uses Tailwind CSS.

## Approach
- Use `@apply` in co-located `.css` files with BEM naming
- Use `@reference` directive for Tailwind v4 class resolution
- Group utility classes: layout → spacing → color → typography

## Component Styles
- Co-locate CSS files with their components: `component.tsx` + `component.css`
- Use BEM naming: `.block`, `.block__element`, `.block--modifier`
- Prefer `@apply` in CSS files over long utility class strings in JSX

## Design Tokens
- Define colors, spacing, and typography in the theme configuration
- Use CSS variables for dynamic values
- Maintain a consistent spacing scale
