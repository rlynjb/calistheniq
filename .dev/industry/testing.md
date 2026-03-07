# Testing Standards

## Unit Tests
- Test behavior, not implementation details
- Use React Testing Library for component tests
- Mock at the network boundary (MSW), not at the module level

## Integration Tests
- Test API endpoints with realistic request/response cycles
- Use test databases or in-memory stores for isolation

## E2E Tests
- Cover critical user paths with Playwright or Cypress
- Run E2E in CI before deployment

## Coverage
- Aim for high confidence, not high coverage numbers
- Focus testing effort on complex business logic and error paths
