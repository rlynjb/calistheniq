# Tailwind CSS Best Practices

## Configuration
- Extend the default theme rather than overriding it
- Define design tokens (colors, spacing, fonts) in `tailwind.config`
- Use CSS variables for dynamic theming
- Configure `content` paths to include all template files
- Use Tailwind v4's `@theme` directive for inline configuration
- Keep custom utilities minimal — prefer composing existing classes

## Component Patterns
- Extract repeated class combinations into CSS components with `@apply`
- Use BEM naming for extracted CSS classes: `.card`, `.card__title`, `.card--highlighted`
- Co-locate component CSS files with their components
- Prefer utility classes for one-off styling
- Use `@apply` in separate CSS files, not inline styles
- Keep class lists readable — group by category (layout, spacing, color, typography)

## Responsive Design
- Design mobile-first — use `sm:`, `md:`, `lg:` for larger screens
- Use container queries (`@container`) for component-level responsiveness
- Avoid fixed widths — use `max-w-` constraints instead
- Test at common breakpoints: 375px, 768px, 1024px, 1440px
- Use `gap` over margins for flex/grid spacing
- Prefer `grid` for 2D layouts, `flex` for 1D layouts

## Dark Mode
- Use `class` strategy for manual dark mode control
- Define color pairs: light background + dark override
- Use semantic color names: `bg-surface`, `text-primary`
- Test contrast ratios in both modes (WCAG AA minimum)
- Use `prefers-color-scheme` media query as initial default

## Performance
- Enable JIT mode (default in v3+)
- Remove unused CSS with content configuration
- Avoid dynamically constructing class names: `text-${color}-500` won't work
- Use `@reference` in separate CSS files to enable Tailwind v4 `@apply`
- Minimize custom CSS — every custom class is a potential maintenance burden
