# React Best Practices

## Component Structure
- Prefer function components with hooks over class components
- Keep components small and focused — one responsibility per component
- Extract reusable logic into custom hooks
- Co-locate related files (component, styles, tests) in the same directory
- Use named exports for components (enables better refactoring tooling)
- Separate container/smart components from presentational/dumb components

## State Management
- Use `useState` for local component state
- Use `useReducer` for complex state with multiple sub-values
- Lift state to the nearest common ancestor — avoid prop drilling with Context
- Use React Context for truly global state (theme, auth, locale)
- Avoid putting everything in global state — prefer local state by default
- Derive computed values inline or with `useMemo` — don't store derived state

## Performance
- Memoize expensive computations with `useMemo`
- Memoize callbacks passed to child components with `useCallback`
- Use `React.memo` for components that render often with the same props
- Avoid creating new objects/arrays in render — stabilize references
- Use lazy loading (`React.lazy` + `Suspense`) for code splitting
- Profile with React DevTools before optimizing — measure, don't guess

## Testing
- Test behavior, not implementation details
- Use React Testing Library over Enzyme
- Write integration tests that render components with their context
- Test user interactions: clicks, typing, form submissions
- Mock API calls at the network layer (MSW) not at the module level
- Aim for high confidence, not high coverage

## Accessibility
- Use semantic HTML elements (`button`, `nav`, `main`, `section`)
- Add `aria-label` to icon-only buttons and links
- Ensure all interactive elements are keyboard accessible
- Manage focus when opening/closing modals and dialogs
- Use `role` attributes only when no semantic element exists
- Test with screen readers and keyboard-only navigation
