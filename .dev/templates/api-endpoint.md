# API Endpoint Template

```ts
import type { Context } from "@netlify/functions";
import { json, errorResponse } from "./lib/responses";

export default async function handler(req: Request, _context: Context) {
  if (req.method === "GET") {
    // Handle GET
    return json({ data: [] });
  }

  if (req.method === "POST") {
    const body = await req.json();
    // Validate input
    // Process request
    return json({ data: body });
  }

  return errorResponse("Method not allowed", 405);
}
```
