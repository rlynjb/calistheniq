# Test Template

```ts
import { describe, it, expect } from "vitest";

describe("{Name}", () => {
  it("should {behavior}", () => {
    // Arrange
    // Act
    // Assert
    expect(true).toBe(true);
  });
});
```

## Guidelines
- Test behavior, not implementation
- One assertion per test when possible
- Use descriptive test names that read as sentences
