---
name: base44-backend
description: "Write and manage Base44 backend functions. Backend functions run on Deno and are invoked via the SDK's `functions.invoke()`. Use this skill when creating, editing, or debugging server-side functions in a Base44 project — including service role access, secrets, error handling, and function deployment."
---

# Base44 Backend

Write backend functions for the Base44 platform. Backend functions run on Deno and live under `base44/functions/` in the project directory.

## Quick Start

Every backend function needs a directory with a config file and an entry point:

```
base44/functions/<function-name>/
  function.jsonc    # { "name": "<function-name>", "entry": "index.ts" }
  index.ts          # entry point
```

### Minimal Function

```typescript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const data = await req.json();

  // Your logic here

  return Response.json({ success: true });
});
```

## Key Concepts

- **Client from request**: Always use `createClientFromRequest(req)` — it inherits the caller's auth context.
- **Service role**: Use `base44.asServiceRole` for admin-level operations (e.g., accessing all records regardless of permissions).
- **Secrets**: Access via `Deno.env.get("SECRET_NAME")`. Configure secrets in the app dashboard.
- **Errors**: Return appropriate HTTP status codes. Wrap logic in try/catch for robustness.

## Invoking Functions

From the frontend or another backend function:

```javascript
const result = await base44.functions.invoke("my-function", { key: "value" });
```

For detailed SDK reference on invoking functions, see the `base44-sdk` skill.
