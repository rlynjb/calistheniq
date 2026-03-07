# Security Best Practices

## Input Validation
- Validate and sanitize all user input at system boundaries
- Use schema validation (Zod, Joi) on API inputs
- Never interpolate user input into queries

## Authentication & Authorization
- Use auth middleware on protected endpoints
- Store secrets in environment variables, never in code
- Implement CSRF protection for state-changing operations

## Dependencies
- Run `npm audit` regularly
- Keep dependencies updated
- Pin dependency versions for reproducible builds

## Headers & Transport
- Use HTTPS everywhere
- Set appropriate CORS headers
- Add security headers (Content-Security-Policy, X-Frame-Options)
