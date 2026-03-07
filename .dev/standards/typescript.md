# TypeScript Standards

## Type Safety
- Enable `strict: true` in tsconfig.json
- Avoid `any` — use `unknown` when the type is truly unknown
- Prefer `interface` for object shapes, `type` for unions
- Define return types for exported functions

## Naming
- PascalCase for types, interfaces, and components
- camelCase for variables, functions, and properties
- Use descriptive names — avoid abbreviations

## Patterns
- Use discriminated unions for state variants
- Use `satisfies` for type checking without widening
- Export types alongside their implementations
