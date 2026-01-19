---
name: base44-coder
description: Build and modify apps on the Base44 platform using the Base44 JavaScript SDK. Use when working with Base44 apps, Base44 SDK, entities (CRUD operations), user authentication, AI agents/conversations, backend functions, integrations, or OAuth connectors. Triggers include creating/editing Base44 apps, working with data entities, implementing auth flows, calling backend functions, or integrating third-party services.
---

# Base44 Coder

Build apps on the Base44 platform using the Base44 JavaScript SDK.

## Quick Start

```javascript
// In Base44-generated apps (pre-configured)
import { base44 } from "@/api/base44Client";

// CRUD operations
const task = await base44.entities.Task.create({ title: "New task", status: "pending" });
const tasks = await base44.entities.Task.list();
await base44.entities.Task.update(task.id, { status: "done" });

// Get current user
const user = await base44.auth.me();
```

```javascript
// External apps
import { createClient } from "@base44/sdk";

const base44 = createClient({ appId: "your-app-id" });
await base44.auth.loginViaEmailPassword("user@example.com", "password");
```

## SDK Modules

| Module | Purpose | Reference |
|--------|---------|-----------|
| `entities` | CRUD operations on data models | [entities.md](references/entities.md) |
| `auth` | Login, register, user management | [auth.md](references/auth.md) |
| `agents` | AI conversations and messages | [base44-agents.md](references/base44-agents.md) |
| `functions` | Backend function invocation | [functions.md](references/functions.md) |
| `integrations` | Third-party services (email, AI, custom) | [integrations.md](references/integrations.md) |
| `connectors` | OAuth tokens (service role only) | [connectors.md](references/connectors.md) |

For client setup and authentication modes, see [client.md](references/client.md).

## Module Selection

**Working with app data?**
- Create/read/update/delete records → `entities`
- Import data from file → `entities.importEntities()`

**User management?**
- Login/register/logout → `auth`
- Get current user → `auth.me()`
- Update user profile → `auth.updateMe()`

**AI features?**
- Chat with AI agents → `agents`
- Manage conversations → `agents.getConversations()`

**Custom backend logic?**
- Run server-side code → `functions.invoke()`
- Need admin access → `base44.asServiceRole.functions.invoke()`

**External services?**
- Built-in integrations (email, AI) → `integrations`
- OAuth services (Google, Slack) → `connectors` (backend only)

## Common Patterns

### Filter and Sort Data

```javascript
const pendingTasks = await base44.entities.Task.filter(
  { status: "pending", assignedTo: userId },  // query
  { created_date: -1 },                        // sort (descending)
  10,                                          // limit
  0                                            // skip
);
```

### Protected Routes (check auth)

```javascript
const user = await base44.auth.me();
if (!user) {
  base44.auth.redirectToLogin(window.location.href);
  return;
}
```

### Backend Function Call

```javascript
// Frontend
const result = await base44.functions.invoke("processOrder", {
  orderId: "123",
  action: "ship"
});

// Backend function (Deno)
import { createClientFromRequest } from "@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { orderId, action } = await req.json();
  // Process with service role for admin access
  const order = await base44.asServiceRole.entities.Orders.get(orderId);
  return Response.json({ success: true });
});
```

### Service Role Access

Use `asServiceRole` in backend functions for admin-level operations:

```javascript
// User mode - respects permissions
const myTasks = await base44.entities.Task.list();

// Service role - full access (backend only)
const allTasks = await base44.asServiceRole.entities.Task.list();
const token = await base44.asServiceRole.connectors.getAccessToken("slack");
```

## Frontend vs Backend

| Capability | Frontend | Backend |
|------------|----------|---------|
| `entities` (user's data) | Yes | Yes |
| `auth` | Yes | Yes |
| `agents` | Yes | Yes |
| `functions.invoke()` | Yes | Yes |
| `integrations` | Yes | Yes |
| `asServiceRole.*` | No | Yes |
| `connectors` | No | Yes |

Backend functions use `Deno.serve()` and `createClientFromRequest(req)` to get a properly authenticated client.
