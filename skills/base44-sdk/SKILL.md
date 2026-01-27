---
name: base44-sdk
description: "Build and modify Base44 apps with the Base44 JavaScript SDK. Use when a project has base44/config.jsonc, code imports '@base44/sdk', or the user asks for Base44 features (entities CRUD, auth, agents, functions, integrations, analytics, connectors, users). Includes client setup (createClient/appId, createClientFromRequest), service role access, and frontend vs backend usage patterns."
---

# Base44 Coder

Build apps on the Base44 platform using the Base44 JavaScript SDK.

## Prerequisites

This skill requires an existing Base44 project with `base44/config.jsonc` present. For new project creation or CLI operations, use the base44-cli skill instead.

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

See module references for examples: [entities.md](references/entities.md), [auth.md](references/auth.md), [functions.md](references/functions.md).

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
