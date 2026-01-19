# Client Setup

How to create and configure the Base44 client.

## Contents
- [In Base44-Generated Apps](#in-base44-generated-apps)
- [In External Apps](#in-external-apps)
- [In Backend Functions](#in-backend-functions)
- [Authentication Modes](#authentication-modes) (Anonymous, User, Service Role)
- [Available Modules](#available-modules)
- [Client Configuration Options](#client-configuration-options)

## In Base44-Generated Apps

The client is pre-configured. Just import:

```javascript
import { base44 } from "@/api/base44Client";

// Ready to use
const tasks = await base44.entities.Task.list();
```

## In External Apps

Install the SDK and create a client:

```bash
npm install @base44/sdk
```

```javascript
import { createClient } from "@base44/sdk";

const base44 = createClient({
  appId: "your-app-id",
  token: "optional-user-token",  // for pre-authenticated requests
  onError: (error) => {          // optional error handler
    console.error("Base44 error:", error);
  }
});
```

## In Backend Functions

Use `createClientFromRequest` to get a client with the caller's auth context:

```javascript
import { createClientFromRequest } from "@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // Client inherits authentication from the request
  const user = await base44.auth.me();
  
  return Response.json({ user });
});
```

## Authentication Modes

| Mode | How to Get | Permissions |
|------|-----------|-------------|
| **Anonymous** | `createClient({ appId })` without token | Public data only |
| **User** | After `loginViaEmailPassword()` or via `createClientFromRequest` | User's own data |
| **Service Role** | `base44.asServiceRole.*` in backend | Full admin access |

## Anonymous Mode

No authentication. Can only access public resources.

```javascript
const base44 = createClient({ appId: "your-app-id" });

// Only works if Task entity allows anonymous read
const publicTasks = await base44.entities.Task.list();
```

## User Mode

After user logs in, the client automatically includes their token.

```javascript
const base44 = createClient({ appId: "your-app-id" });

// Login sets the token
await base44.auth.loginViaEmailPassword("user@example.com", "password");

// Subsequent requests are authenticated
const user = await base44.auth.me();
const myTasks = await base44.entities.Task.list();  // filtered by permissions
```

## Service Role Mode

Admin-level access. **Backend only.**

```javascript
// Inside a backend function
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // User mode - respects permissions
  const myTasks = await base44.entities.Task.list();
  
  // Service role - bypasses permissions
  const allTasks = await base44.asServiceRole.entities.Task.list();
  const allUsers = await base44.asServiceRole.entities.User.list();
  const oauthToken = await base44.asServiceRole.connectors.getAccessToken("slack");
  
  return Response.json({ myTasks, allTasks });
});
```

## Available Modules

The client exposes these modules:

```javascript
base44.entities      // CRUD operations
base44.auth          // Authentication
base44.agents        // AI conversations
base44.functions     // Backend function invocation
base44.integrations  // Third-party services
base44.appLogs       // Logging

// Service role only (backend)
base44.asServiceRole.entities
base44.asServiceRole.functions
base44.asServiceRole.connectors
```

## Client Configuration Options

```javascript
createClient({
  appId: "your-app-id",      // Required
  token: "jwt-token",        // Optional: pre-set auth token
  onError: (error) => {},    // Optional: global error handler
});
```
