# Component Template

```tsx
"use client";

import "./{name}.css";

interface {Name}Props {
  // props here
}

export function {Name}({ }: {Name}Props) {
  return (
    <div className="{name}">
      {/* content */}
    </div>
  );
}
```

```css
/* {name}.css */
@reference "tailwindcss";

.{name} {
  @apply /* styles */;
}
```
