# Client Setup

How to create and configure the Base44 client.

## Contents
- [In Base44-Generated Apps](#in-base44-generated-apps)
- [In External Apps](#in-external-apps)
- [In Backend Functions](#in-backend-functions)
- [Authentication Modes](#authentication-modes) (Anonymous, User, Service Role)
- [Available Modules](#available-modules)
- [App Module](#app-module)
- [Browser Automation (Service Role)](#browser-automation-service-role)
- [Client Methods](#client-methods) (`setToken`, `cleanup`, `fetchWithAuth`)
- [Low-Level Token Utilities (Browser Only)](#low-level-token-utilities-browser-only)
- [Client Configuration Options](#client-configuration-options)

## In Base44-Generated Apps

Inside a Base44 app, the client is automatically created and configured. Import it from `@/api/base44Client` and use it as `base44`:

```javascript
const tasks = await base44.entities.Task.list();
```

## In External Apps

When using Base44 as a backend from an external app, install the SDK and create a client by calling `createClient()` directly:

```bash
npm install @base44/sdk
```

```javascript
import { createClient } from "@base44/sdk";

// IMPORTANT: The parameter name is 'appId' (NOT 'clientId', NOT 'id')
// IMPORTANT: onError must be nested inside 'options' object
const base44 = createClient({
  appId: "your-app-id",          // Required: Use 'appId' parameter
  token: "optional-user-token",  // Optional: for pre-authenticated requests
  options: {                      // Optional: configuration options
    onError: (error) => {         // Optional: error handler (must be in options)
      console.error("Base44 error:", error);
    }
  }
});
```

**Common Mistakes:**
- ❌ `createClient({ clientId: "..." })` - WRONG parameter name
- ❌ `createClient({ id: "..." })` - WRONG parameter name
- ❌ `createClient({ appId: "...", onError: ... })` - WRONG: onError must be in options
- ✅ `createClient({ appId: "..." })` - CORRECT parameter name
- ✅ `createClient({ appId: "...", options: { onError: ... } })` - CORRECT: onError in options

## In Backend Functions

`createClientFromRequest()` is designed for Base44-hosted backend functions. It extracts auth from request headers that Base44 injects and returns a client that includes service role access (`base44.asServiceRole`). For frontends and external backends, use `createClient()` instead.

```javascript
import { createClientFromRequest } from "@base44/sdk";

export default async function (req) {
  const base44 = createClientFromRequest(req);
  
  // Client inherits authentication from the request
  const user = await base44.auth.me();
  
  return Response.json({ user });
}
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
export default async function (req) {
  const base44 = createClientFromRequest(req);
  
  // User mode - respects permissions
  const myTasks = await base44.entities.Task.list();
  
  // Service role - bypasses permissions
  const allTasks = await base44.asServiceRole.entities.Task.list();
  const allUsers = await base44.asServiceRole.entities.User.list();
  const oauthToken = await base44.asServiceRole.connectors.getAccessToken("slack");
  
  return Response.json({ myTasks, allTasks });
}
```

## Available Modules

The client exposes these modules:

```javascript
base44.actors        // Actor sessions and messaging
base44.agents        // AI conversations
base44.aiGateway     // Connect your own LLM SDK to the Base44 AI Gateway
base44.analytics     // Event tracking
base44.app           // Read the app's own public settings (visibility, etc.)
base44.appLogs       // App usage logging
base44.auth          // Authentication
base44.connectors    // Per-user OAuth flows (UserConnectorsModule)
base44.entities      // CRUD operations
base44.functions     // Backend function invocation
base44.integrations  // Third-party services
base44.payments      // Checkouts and purchases — see references/payments.md
base44.users         // User invitations

// Service role only (backend)
base44.asServiceRole.agents
base44.asServiceRole.aiGateway
base44.asServiceRole.appLogs
base44.asServiceRole.browser     // Remote browser automation (CDP) — see below
base44.asServiceRole.connectors  // App-scoped OAuth tokens (ConnectorsModule)
base44.asServiceRole.entities
base44.asServiceRole.functions
base44.asServiceRole.integrations
base44.asServiceRole.payments    // Checkouts, refunds, subscription changes — see references/payments.md
base44.asServiceRole.sso         // SSO token generation
```

Note: `base44.actors` is only available in user/anonymous mode (there is no `asServiceRole.actors`). `base44.asServiceRole.browser` and `base44.asServiceRole.payments` are only available in service role mode.

## App Module

`base44.app` reads the app's own public configuration. It works in any authentication mode — the client sends its token, if it has one, with the request.

```javascript
try {
  const { id, public_settings } = await base44.app.getPublicSettings();
  console.log("App visibility:", public_settings);
} catch (error) {
  // Rejects with a Base44Error (status 403) when the visitor can't access the app
  if (error.status === 403 && error.data?.extra_data?.reason === "auth_required") {
    base44.auth.redirectToLogin("<URL to return to after login>");
  }
}
```

`public_settings` is one of: `"private_with_login"`, `"workspace_with_login"`, `"public_with_login"`, `"public_without_login"` (or another string value). If `getPublicSettings()` rejects with a 403, check `error.data.extra_data.reason`:
- `auth_required`: The visitor must sign in.
- `user_not_registered`: The visitor is signed in but doesn't have access.

## Browser Automation (Service Role)

`base44.asServiceRole.browser` creates remote browser sessions you control with a CDP client library such as Playwright or Puppeteer. Service role only (backend functions). Each session is independent — Base44 doesn't store browser state — and keeps running until ended or its timeout expires.

```javascript
import { createClientFromRequest } from "@base44/sdk";
import { chromium } from "playwright-core";

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const session = await base44.asServiceRole.browser.getSession({
    captureDebugArtifacts: true,   // optional, defaults to true
    sessionTimeoutSeconds: 600,    // optional, Base44 applies a default when omitted
  });

  try {
    const browser = await chromium.connectOverCDP(session.connectionUrl);
    const page = browser.contexts()[0]?.pages()[0] ?? (await browser.newPage());
    await page.goto("https://example.com");
    const title = await page.title();
    await browser.close();
    return Response.json({ title });
  } finally {
    await session.end(); // equivalent to base44.asServiceRole.browser.endSession(session.sessionId)
  }
}
```

`getSession()` returns `{ sessionId, connectionUrl, connectionScope, connectionExpiresAt?, sessionExpiresAt?, end() }`. `connectionUrl` is a signed CDP WebSocket URL — treat it as a credential (don't log it or send it to the frontend). Use `endSession(sessionId)` to end a session created in a different request; ending an already-ended session succeeds.

## Client Methods

The client provides these methods:

```javascript
// Set authentication token for all subsequent requests
base44.setToken(newToken);

// Cleanup WebSocket connections (call when done with client)
base44.cleanup();

// Call one of your app's own server routes with this client's credentials attached
await base44.fetchWithAuth('/api/orders');
```

### setToken

Updates the authentication token for all subsequent API requests and WebSocket connections.

```javascript
// After receiving a token (e.g., from external auth)
base44.setToken("new-jwt-token");
```

### cleanup

Disconnects WebSocket connections. Call when you're done with the client or when the component unmounts.

```javascript
// Cleanup on component unmount (React example)
useEffect(() => {
  return () => base44.cleanup();
}, []);
```

### fetchWithAuth

Calls one of your app's own server routes with this client's credentials attached — the equivalent of `fetch()`, but with whatever the client holds (a signed-in user's token, or everything a `createClientFromRequest()` client read from the incoming request) added automatically. Use it for route-to-route calls where a plain `fetch()` wouldn't carry any auth/platform headers.

`path` must be a relative path on your app's own origin (e.g. `/api/orders`) — an absolute URL or `//host` throws. To call a Base44 backend function, use `functions.fetch()` instead; for another origin, use plain `fetch()`.

```javascript
// Browser: call your app's own server route as the signed-in user
const response = await base44.fetchWithAuth('/api/orders');
const orders = await response.json();

// POST with a JSON body
const response2 = await base44.fetchWithAuth('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: 'abc', quantity: 2 }),
});
```

```javascript
// Server-side (e.g. Nitro): reach the app's own route as this request
import { fetch } from 'nitro';
import { createClientFromRequest } from '@base44/sdk';

const base44 = createClientFromRequest(event.req);
const response = await base44.fetchWithAuth('/api/items', { fetch });
```

## Low-Level Token Utilities (Browser Only)

`@base44/sdk` also exports standalone functions for manual token management. These require a browser environment (they read/write `window.localStorage` and the URL) and can't be used in the backend. In most cases the client and `auth` module handle tokens automatically — reach for these only for custom auth flows or when you need direct access to stored tokens.

```javascript
import {
  getAccessToken,
  saveAccessToken,
  removeAccessToken,
  getLoginUrl,
} from "@base44/sdk";

// Read a token from the URL (?access_token=...) or local storage.
// By default also saves a URL token to storage and strips it from the URL.
const token = getAccessToken(); // -> string | null
const token2 = getAccessToken({ storageKey: "my_app_token" });
const token3 = getAccessToken({ saveToStorage: false, removeFromUrl: false });

// Save a token to local storage. Returns true/false.
const saved = saveAccessToken(token, { storageKey: "my_app_token" }); // options required (can be {})

// Remove a token from local storage. Returns true/false.
// Prefer base44.auth.logout() for standard logout flows.
removeAccessToken({ storageKey: "my_app_token" }); // options required (can be {})

// Build a login URL with a return-to redirect.
// Prefer base44.auth.redirectToLogin() when you have a client.
const loginUrl = getLoginUrl("/dashboard", {
  serverUrl: "https://base44.app",
  appId: "my-app-123",
  loginPath: "/login", // optional, defaults to "/login"
});
// -> "https://base44.app/login?from_url=%2Fdashboard&app_id=my-app-123"
```

Default storage key for all of these is `"base44_access_token"`; `getAccessToken`'s default URL parameter name is `"access_token"`.

## Client Configuration Options

```javascript
createClient({
  appId: "your-app-id",      // Required: MUST use 'appId' (not 'clientId' or 'id')
  token: "jwt-token",        // Optional: pre-set auth token
  options: {                 // Optional: configuration options
    onError: (error) => {}   // Optional: global error handler (must be in options)
  }
});
```

**⚠️ Critical:**
- The parameter name is `appId`, not `clientId` or `id`. Using the wrong parameter name will cause errors.
- The `onError` handler must be nested inside the `options` object, not at the top level.

## Type Definitions

### CreateClientConfig

```typescript
/** Configuration for creating a Base44 client. */
interface CreateClientConfig {
  /** The Base44 app ID (required). */
  appId: string;
  /** The Base44 server URL. Defaults to `"https://base44.app"`. Set for a local dev server. */
  serverUrl?: string;
  /** User authentication token. Used to authenticate as a specific user. */
  token?: string;
  /** @internal Service role token; only set automatically in Base44-hosted backend functions. */
  serviceToken?: string;
  /** Controls app analytics for this client. Omit to preserve the default analytics behavior. */
  analytics?: CreateClientAnalyticsConfig;
  /** Additional client options. */
  options?: CreateClientOptions;
}

/** Options for creating a Base44 client. */
interface CreateClientOptions {
  /** Optional error handler called whenever an API error occurs, or a client can't connect to an actor. */
  onError?: (error: Error) => void;
}

/** Configuration for the SDK's app analytics module. */
interface CreateClientAnalyticsConfig {
  /**
   * Whether app analytics is enabled for this client.
   * When disabled, automatic analytics and calls to `analytics.track()` are no-ops.
   * @defaultValue `true`
   */
  enabled: boolean;
}
```

### Base44Client

```typescript
/** The Base44 client instance. */
interface Base44Client {
  /** Actors module for connecting to actor sessions and exchanging messages with actors. */
  actors: ActorsModule;
  /** Agents module for managing AI agent conversations. */
  agents: AgentsModule;
  /** AI Gateway module for connecting to the Base44 AI Gateway with your own SDK. */
  aiGateway: AiGatewayModule;
  /** Analytics module for tracking custom events. */
  analytics: AnalyticsModule;
  /** App module for reading the app's own public configuration. */
  app: AppModule;
  /** App logs module for tracking app usage. */
  appLogs: AppLogsModule;
  /** Auth module for user authentication and management. */
  auth: AuthModule;
  /** Entities module for CRUD operations on your data models. */
  entities: EntitiesModule;
  /** Functions module for invoking custom backend functions. */
  functions: FunctionsModule;
  /** Integrations module for calling pre-built integration methods. */
  integrations: IntegrationsModule;
  /** Payments module for checkouts and purchases. See references/payments.md. */
  payments: PaymentsModule;

  /** Cleanup function to disconnect WebSocket connections. */
  cleanup(): void;

  /** Sets a new authentication token for all subsequent requests. */
  setToken(newToken: string): void;

  /** Gets the current client configuration. @internal */
  getConfig(): { serverUrl: string; appId: string; requiresAuth: boolean };

  /** Calls one of your app's own server routes with this client's credentials attached. See the `fetchWithAuth` section above. */
  fetchWithAuth(path: string, init?: FetchWithAuthInit): Promise<Response>;

  /** Per-user OAuth flows. Each end user has their own connection. */
  connectors: UserConnectorsModule;

  /** Provides access to modules with elevated service role permissions (backend only). */
  readonly asServiceRole: {
    agents: AgentsModule;
    /** AI Gateway module with the service-role token. */
    aiGateway: AiGatewayModule;
    appLogs: AppLogsModule;
    /** Browser module for remote browser sessions. See "Browser Automation (Service Role)" above. */
    browser: BrowserModule;
    /** App-scoped OAuth tokens. All users share the same connected account. */
    connectors: ConnectorsModule;
    entities: EntitiesModule;
    functions: FunctionsModule;
    integrations: IntegrationsModule;
    /** Payments module for creating checkouts, refunds, and subscription changes. See references/payments.md. */
    payments: ServiceRolePaymentsModule;
    /** SSO token generation for users. */
    sso: SsoModule;
    cleanup(): void;
  };
}
```
