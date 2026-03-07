# Code Audit Prompt

Audit this Next.js + TypeScript + Tailwind CSS project for quality, security, and best practice compliance.

## Focus Areas
1. Type safety — find `any` escapes, missing return types, unsafe casts
2. Component health — oversized components, prop drilling, missing error boundaries
3. Security — input validation, auth checks, secret exposure
4. Performance — unnecessary re-renders, missing memoization, bundle size
5. Accessibility — ARIA labels, semantic HTML, keyboard navigation

## Output
For each finding: file path, line number, severity (high/medium/low), and recommended fix.
