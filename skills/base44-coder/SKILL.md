---
name: base44-coder
description: Base44 JavaScript/TypeScript SDK for building frontend and backend applications. Use when working with Base44 projects (React/Vue/Next.js), Base44 imports ("@base44/sdk", "@/api/base44Client"), or Base44 SDK modules (entities, auth, agents, functions, integrations, analytics). For CLI commands (deploy, push, login), use base44-cli instead.
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

// IMPORTANT: Use 'appId' (NOT 'clientId' or 'id')
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
| `analytics` | Track custom events and user activity | [analytics.md](references/analytics.md) |
| `appLogs` | Log and fetch app usage data | [app-logs.md](references/app-logs.md) |
| `users` | Invite users to the app | [users.md](references/users.md) |

For client setup and authentication modes, see [client.md](references/client.md).

## Creating a Client (External Apps)

When creating a client in external apps, **ALWAYS use `appId` as the parameter name**:

```javascript
import { createClient } from "@base44/sdk";

// ✅ CORRECT
const base44 = createClient({ appId: "your-app-id" });

// ❌ WRONG - Do NOT use these:
// const base44 = createClient({ clientId: "your-app-id" });  // WRONG
// const base44 = createClient({ id: "your-app-id" });        // WRONG
```

**Required parameter:** `appId` (string) - Your Base44 application ID

**Optional parameters:**
- `token` (string) - Pre-authenticated user token
- `options` (object) - Configuration options
  - `options.onError` (function) - Global error handler

**Example with error handler:**
```javascript
const base44 = createClient({
  appId: "your-app-id",
  options: {
    onError: (error) => {
      console.error("Base44 error:", error);
    }
  }
});
```

## Module Selection

**Working with app data?**
- Create/read/update/delete records → `entities`
- Import data from file → `entities.importEntities()`
- Realtime updates → `entities.EntityName.subscribe()`

**User management?**
- Login/register/logout → `auth`
- Get current user → `auth.me()`
- Update user profile → `auth.updateMe()`
- Invite users → `users.inviteUser()`

**AI features?**
- Chat with AI agents → `agents`
- Create new conversation → `agents.createConversation()`
- Manage conversations → `agents.getConversations()`

**Custom backend logic?**
- Run server-side code → `functions.invoke()`
- Need admin access → `base44.asServiceRole.functions.invoke()`

**External services?**
- Built-in integrations (email, AI) → `integrations`
- OAuth services (Google, Slack) → `connectors` (backend only)

**Tracking and analytics?**
- Track custom events → `analytics.track()`
- Log page views → `appLogs.logUserInApp()`
- Get usage stats → `appLogs.getStats()`

## Common Patterns

### Filter and Sort Data

```javascript
const pendingTasks = await base44.entities.Task.filter(
  { status: "pending", assignedTo: userId },  // query
  "-created_date",                             // sort (descending)
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
| `analytics` | Yes | Yes |
| `appLogs` | Yes | Yes |
| `users` | Yes | Yes |
| `asServiceRole.*` | No | Yes |
| `connectors` | No | Yes |

Backend functions use `Deno.serve()` and `createClientFromRequest(req)` to get a properly authenticated client.
