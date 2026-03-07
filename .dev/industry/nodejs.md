# Node.js Best Practices

## Project Structure
- Organize by feature/domain, not by type (routes, controllers, models)
- Keep entry points thin — delegate to modules
- Use ES modules (`import/export`) over CommonJS (`require`)
- Separate configuration from code — use environment variables
- Use a single `lib/` or `src/` directory for source code
- Keep serverless functions small and focused — one responsibility per function

## Error Handling
- Always handle promise rejections — use try/catch with async/await
- Create custom error classes for domain-specific errors
- Log errors with context (request ID, user ID, operation name)
- Return user-friendly error messages — never expose stack traces
- Use error classification to map internal errors to HTTP status codes
- Implement graceful shutdown for long-running processes

## Security
- Never commit secrets — use environment variables and `.env` files (gitignored)
- Validate and sanitize all user input at system boundaries
- Use parameterized queries — never interpolate user input into SQL/NoSQL queries
- Escape HTML when rendering user-provided content
- Set appropriate CORS headers — restrict origins in production
- Keep dependencies updated — run `npm audit` regularly
- Use helmet.js or equivalent for HTTP security headers

## Performance
- Use streaming for large payloads instead of buffering
- Implement caching at appropriate layers (memory, CDN, database)
- Use connection pooling for database and HTTP connections
- Avoid blocking the event loop — offload CPU-intensive work
- Monitor memory usage — watch for leaks in long-running processes
- Use compression for API responses

## Testing
- Write unit tests for pure business logic
- Write integration tests for API endpoints
- Use test databases or in-memory stores for isolation
- Mock external services at the HTTP boundary (MSW, nock)
- Test error paths — not just happy paths
- Use code coverage as a guide, not a goal
