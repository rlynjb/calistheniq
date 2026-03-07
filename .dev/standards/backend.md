# Backend Standards

This project uses Next.js API routes / serverless functions.

## API Design
- Return consistent response shapes: `{ data }` on success, `{ error }` on failure
- Use appropriate HTTP status codes (200, 201, 400, 401, 404, 500)
- Validate request bodies before processing

## Error Handling
- Classify errors and map to HTTP status codes
- Log errors with context (request ID, operation name)
- Never expose stack traces to clients

## Security
- Validate all inputs at the boundary
- Use environment variables for secrets
- Add rate limiting for public endpoints
