---
name: base44-sdk
description: "Base44 SDK implementation for existing projects (requires base44/config.jsonc). Activate when: (1) config file exists, (2) @base44/sdk imports present, (3) user wants to implement features with SDK modules: entities, auth, agents, functions, integrations. Handles code implementation: data CRUD, authentication, AI integration, backend calls, file operations, analytics. Keywords: implement, build feature, write code, create records, add login. Excludes: CLI commands (npx base44 create/deploy/push), project initialization. Use base44-cli for those. Context: frontend TypeScript/JavaScript, backend Deno."
---

# Base44 Coder

Build apps on the Base44 platform using the Base44 JavaScript SDK.

## ⚡ IMMEDIATE ACTION REQUIRED - Read This First

This skill activates when you need to implement features in an existing Base44 project.

## ⚡ MANDATORY PROJECT STATE CHECK

**CRITICAL: Run this check BEFORE any action:**

```bash
test -f base44/config.jsonc && echo "✅ PROJECT EXISTS" || echo "❌ NO PROJECT"
```

### If "❌ NO PROJECT":

**STOP IMMEDIATELY** - Do not attempt SDK operations.

**User Communication:**
```
⚠️ No Base44 project detected in this directory.

To use the Base44 SDK, you must first initialize a project.

Would you like me to:
1. Create a new Base44 project using the CLI?
2. Help you navigate to an existing project directory?

I'll transfer you to the base44-cli skill for project setup.
```

**Action:** Transfer to base44-cli skill with context:
- Pass the original user request
- Note: "User needs project initialization before SDK implementation"

### If "✅ PROJECT EXISTS":

**Proceed with SDK implementation:**
1. Read base44/config.jsonc to understand project structure
2. Check package.json for @base44/sdk installation status
3. Implement requested features using Base44 SDK APIs

## When to Use This Skill vs base44-cli

**✅ Use base44-sdk when:**
- Base44 project EXISTS (base44/config.jsonc present)
- User wants to: implement features, write SDK code, build functionality
- Code context: @base44/sdk imports, SDK API calls
- Keywords: "implement", "build", "write code", "add feature", "create records"

**❌ Use base44-cli when:**
- No Base44 project (empty directory or missing config.jsonc)
- User wants to: initialize project, run CLI commands, deploy, define schemas
- Keywords: "create project", "npx base44", "initialize", "deploy", "push entities"

**Decision Logic:**
```
IF (user mentions "create/build app"):
  IF (base44/config.jsonc missing):
    → Use base44-cli (initialization needed)
  ELSE:
    → Use base44-sdk (project exists, implement features)

ELSE IF (explicit CLI command mentioned):
  → Use base44-cli

ELSE IF (SDK APIs or code implementation mentioned):
  → Use base44-sdk (check config.jsonc exists first)
```

## Quick Start

```javascript
// In Base44-generated apps, base44 client is pre-configured and available

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
| `integrations` | AI, email, file uploads, custom APIs | [integrations.md](references/integrations.md) |
| `connectors` | OAuth tokens (service role only) | [connectors.md](references/connectors.md) |
| `analytics` | Track custom events and user activity | [analytics.md](references/analytics.md) |
| `appLogs` | Log user activity in app | [app-logs.md](references/app-logs.md) |
| `users` | Invite users to the app | [users.md](references/users.md) |

For client setup and authentication modes, see [client.md](references/client.md).

## Installation

Install the Base44 SDK:

```bash
npm install @base44/sdk
```

**Important:** Never assume or hardcode the `@base44/sdk` package version. Always install without a version specifier to get the latest version.

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
- Generate text/JSON with AI → `integrations.Core.InvokeLLM()`
- Generate images → `integrations.Core.GenerateImage()`

**Custom backend logic?**
- Run server-side code → `functions.invoke()`
- Need admin access → `base44.asServiceRole.functions.invoke()`

**External services?**
- Send emails → `integrations.Core.SendEmail()`
- Upload files → `integrations.Core.UploadFile()`
- Custom APIs → `integrations.custom.call()`
- OAuth tokens (Google, Slack) → `connectors` (backend only)

**Tracking and analytics?**
- Track custom events → `analytics.track()`
- Log page views/activity → `appLogs.logUserInApp()`

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
