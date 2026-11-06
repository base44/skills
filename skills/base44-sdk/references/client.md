# Client Setup

How to create and configure the Base44 client.

## Contents
- [In Base44-Generated Apps](#in-base44-generated-apps)
- [In External Apps](#in-external-apps)
- [In Backend Functions](#in-backend-functions)
- [Authentication Modes](#authentication-modes) (Anonymous, User, Service Role)
- [Available Modules](#available-modules)
- [Client Methods](#client-methods)
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

### Headers `createClientFromRequest()` reads

Base44 injects these headers when it forwards a request to your backend function. You don't set them yourself — `createClientFromRequest()` reads them and wires the resulting client automatically:

| Header | Used for |
|--------|----------|
| `Authorization: Bearer <token>` | The calling user's token (`base44.entities`, `base44.auth`, etc.). |
| `Base44-Service-Authorization: Bearer <token>` | The service role token that powers `base44.asServiceRole`. |
| `Base44-App-Id` | The app ID. **Required** — throws if missing. |
| `Base44-Api-Url` | Overrides the default `serverUrl` (`https://base44.app`). |
| `Base44-Functions-Version` | Propagated to outgoing function calls so draft/published resolution stays consistent. |
| `Base44-State` | The platform's signed proof that the original caller passed the workspace IP allowlist; forwarded as-is so downstream calls are still recognized. |
| `X-Data-Env` | Propagated only when it's exactly `"dev"` or `"prod"`, so entity calls from the function stay in the same data environment (e.g. test data) as the triggering request. |

`Authorization` and `Base44-Service-Authorization`, when present, must be in `Bearer <token>` format — otherwise `createClientFromRequest()` throws.

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
base44.actors        // Actor session connections and messaging
base44.agents        // AI conversations
base44.aiGateway     // AI Gateway access for bring-your-own-SDK calls
base44.analytics     // Event tracking
base44.app           // Reads the app's own public configuration
base44.appLogs       // App usage logging
base44.auth          // Authentication
base44.connectors    // Per-user OAuth flows (UserConnectorsModule)
base44.entities      // CRUD operations
base44.functions     // Backend function invocation
base44.integrations  // Third-party services
base44.payments      // Checkouts and purchases (see payments.md)
base44.users         // User invitations

// Service role only (backend)
base44.asServiceRole.agents
base44.asServiceRole.aiGateway
base44.asServiceRole.appLogs
base44.asServiceRole.browser     // Remote browser sessions (see browser.md)
base44.asServiceRole.connectors  // App-scoped OAuth tokens (ConnectorsModule)
base44.asServiceRole.entities
base44.asServiceRole.functions
base44.asServiceRole.integrations
base44.asServiceRole.payments    // Checkouts, refunds, subscription changes (see payments.md)
base44.asServiceRole.sso         // SSO token generation
```

See `app.md`, `payments.md`, and `browser.md` for full method details on those three modules.

## Client Methods

The client provides these methods:

```javascript
// Set authentication token for all subsequent requests
base44.setToken(newToken);

// Call one of your app's own server routes with this client's credentials attached
await base44.fetchWithAuth("/api/orders");

// Cleanup WebSocket connections (call when done with client)
base44.cleanup();
```

### setToken

Updates the authentication token for all subsequent API requests and WebSocket connections.

```javascript
// After receiving a token (e.g., from external auth)
base44.setToken("new-jwt-token");
```

### fetchWithAuth

Calls one of your app's own server routes with this client's credentials attached — the same `fetch()`, but with whatever auth this client holds (a browser client's user token, or a backend client's full set of forwarded platform headers) added automatically.

This matters most for route-to-route calls on the backend: a sub-request built by your framework carries none of the headers from the request that triggered it, so a plain `fetch()` to another of your routes looks anonymous and that route's own `createClientFromRequest()` throws on the missing `Base44-App-Id`. `fetchWithAuth()` forwards everything — the caller's token, `Base44-App-Id`, `Base44-Api-Url`, `Base44-Functions-Version`, `Base44-State`, `X-Data-Env`, and the service credential — so the callee can rebuild an equivalent client, service role included.

The path must be relative and on your app's own origin (e.g. `/api/orders`); anything that resolves to another origin throws. To call a Base44 backend function, use `functions.fetch()` instead; for another origin, use plain `fetch()`.

```javascript
// Browser: call your app's own server route as the signed-in user
const response = await base44.fetchWithAuth("/api/orders");
const orders = await response.json();

// POST with a JSON body
await base44.fetchWithAuth("/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ productId: "abc", quantity: 2 }),
});
```

### cleanup

Disconnects WebSocket connections. Call when you're done with the client or when the component unmounts.

```javascript
// Cleanup on component unmount (React example)
useEffect(() => {
  return () => base44.cleanup();
}, []);
```

## Client Configuration Options

```javascript
createClient({
  appId: "your-app-id",      // Required: MUST use 'appId' (not 'clientId' or 'id')
  token: "jwt-token",        // Optional: pre-set auth token
  serverUrl: "https://base44.app", // Optional: defaults to https://base44.app; override to point at a local dev server
  analytics: {                // Optional: omit to keep default analytics behavior
    enabled: true              // Set to false to disable automatic analytics and make analytics.track() a no-op
  },
  options: {                 // Optional: configuration options
    onError: (error) => {}   // Optional: global error handler (must be in options)
  }
});
```

**⚠️ Critical:**
- The parameter name is `appId`, not `clientId` or `id`. Using the wrong parameter name will cause errors.
- The `onError` handler must be nested inside the `options` object, not at the top level.
- `serverUrl` defaults to `https://base44.app`. You don't need to set it for production use — only override it to target a local development server.

## Type Definitions

### CreateClientConfig

```typescript
/** Configuration for creating a Base44 client. */
interface CreateClientConfig {
  /** The Base44 app ID (required). Find it in the app editor URL, between `/apps/` and `/editor/`. */
  appId: string;
  /** The Base44 server URL. Defaults to "https://base44.app". Override to target a local dev server. */
  serverUrl?: string;
  /** User authentication token. Used to authenticate as a specific user. */
  token?: string;
  /** @internal Service role token; only set automatically in Base44-hosted backend functions. */
  serviceToken?: string;
  /** Controls app analytics for this client. Omit to preserve the default behavior. */
  analytics?: CreateClientAnalyticsConfig;
  /** @internal Whether authentication is required; redirects to login if the user isn't authenticated. */
  requiresAuth?: boolean;
  /** @internal The base URL of the app, used for login redirects. */
  appBaseUrl?: string;
  /** @internal Version string for the functions API. */
  functionsVersion?: string;
  /** @internal Additional headers to include in API requests. */
  headers?: Record<string, string>;
  /** Additional client options. */
  options?: CreateClientOptions;
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

/** Options for creating a Base44 client. */
interface CreateClientOptions {
  /**
   * Optional error handler called when an API request fails or a client can't
   * connect to an actor. Errors are usually `Base44Error` instances — check
   * `error.status` for the HTTP status code (`undefined` for network errors).
   */
  onError?: (error: Error) => void;
  /**
   * @internal Forces the actors transport. `"auto"` (default) connects directly
   * to the actor and falls back to the platform proxy when unsupported;
   * `"proxy"` always uses the platform proxy; `"direct"` disables the fallback.
   */
  actorsTransport?: "auto" | "proxy" | "direct";
}
```

### Base44Client

```typescript
/** The Base44 client instance. */
interface Base44Client {
  /** Agents module for managing AI agent conversations. */
  agents: AgentsModule;
  /** AI Gateway module for connecting to the Base44 AI Gateway with your own SDK. */
  aiGateway: AiGatewayModule;
  /** Analytics module for tracking custom events. */
  analytics: AnalyticsModule;
  /** App logs module for tracking app usage. */
  appLogs: AppLogsModule;
  /** App module for reading the app's own public configuration. */
  app: AppModule;
  /** Actors module for connecting to actor sessions and exchanging messages with actors. */
  actors: ActorsModule;
  /** Auth module for user authentication and management. */
  auth: AuthModule;
  /** Entities module for CRUD operations on your data models. */
  entities: EntitiesModule;
  /** Functions module for invoking custom backend functions. */
  functions: FunctionsModule;
  /** Integrations module for calling pre-built integration methods. */
  integrations: IntegrationsModule;
  /** Payments module for checkouts and purchases. */
  payments: PaymentsModule;

  /** Cleanup function to disconnect WebSocket connections. */
  cleanup(): void;

  /** Sets a new authentication token for all subsequent requests. */
  setToken(newToken: string): void;

  /** Calls one of your app's own server routes with this client's credentials attached. */
  fetchWithAuth(path: string, init?: FetchWithAuthInit): Promise<Response>;

  /** @internal Gets the current client configuration. */
  getConfig(): { serverUrl: string; appId: string; requiresAuth: boolean };

  /** Per-user OAuth flows. Each end user has their own connection. */
  connectors: UserConnectorsModule;

  /** Provides access to modules with elevated service role permissions (backend only). */
  readonly asServiceRole: {
    agents: AgentsModule;
    /** AI Gateway module using the service-role token. */
    aiGateway: AiGatewayModule;
    appLogs: AppLogsModule;
    /** Browser module for remote browser sessions. */
    browser: BrowserModule;
    /** App-scoped OAuth tokens. All users share the same connected account. */
    connectors: ConnectorsModule;
    entities: EntitiesModule;
    functions: FunctionsModule;
    integrations: IntegrationsModule;
    /** Payments module for creating checkouts, refunds, and subscription changes. */
    payments: ServiceRolePaymentsModule;
    /** SSO token generation for users. */
    sso: SsoModule;
    cleanup(): void;
  };
}
```

Note: `base44.users` (user invitations) is also present on the returned client object at runtime, but — unlike the modules above — it isn't declared on the `Base44Client` interface in `client.types.ts`.
