# TypeScript Best Practices

## Type Safety
- Enable `strict: true` in tsconfig.json — non-negotiable for new projects
- Prefer `interface` for object shapes, `type` for unions and intersections
- Avoid `any` — use `unknown` when the type is truly unknown
- Use `as const` for literal type inference on objects and arrays
- Narrow types with type guards instead of type assertions
- Define return types for public API functions

## Generics
- Use generics when a function works with multiple types but maintains type relationships
- Constrain generics with `extends` to enforce minimum shape
- Prefer fewer generic parameters — complexity grows exponentially
- Name generic parameters descriptively when more than one: `TInput`, `TOutput`
- Use default generic parameters for common cases

## Utility Types
- Use `Partial<T>` for optional updates
- Use `Required<T>` to make all properties mandatory
- Use `Pick<T, K>` and `Omit<T, K>` to derive sub-types
- Use `Record<K, V>` for dictionaries
- Use `ReturnType<T>` to extract return types from functions
- Combine utility types: `Partial<Pick<User, 'name' | 'email'>>`

## Project Config
- Enable `noUncheckedIndexedAccess` for safer array/object access
- Enable `noImplicitReturns` to catch missing returns
- Enable `exactOptionalPropertyTypes` for precise optional handling
- Use path aliases (`@/`) for clean imports
- Keep `lib` and `target` aligned with your runtime
- Use project references for monorepo setups

## Common Patterns
- Use discriminated unions for state machines and variants
- Prefer `readonly` arrays and properties for immutable data
- Use template literal types for string patterns
- Define error types and use `Result<T, E>` pattern for fallible operations
- Export types alongside their implementations
- Use `satisfies` operator for type checking without widening
