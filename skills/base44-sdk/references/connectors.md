# Connectors Module

OAuth token management for external services, giving you raw tokens to call external APIs directly (unlike `integrations`, which wraps pre-built calls).

- **`base44.connectors`** — App user OAuth flows: start/disconnect the current user's own connection (frontend).
- **`base44.asServiceRole.connectors`** — Retrieve tokens and call metered connectors (backend/service role only).

There are two connector types, by whether the token is shared across the app or specific to each user:

- **Shared connectors**: One OAuth token shared by all app users (e.g. posting to a company Slack channel). Two forms: **platform connectors** (connected from the app's Integration settings, identified by an integration type string, retrieved with `getConnection()`) and **workspace-registered connectors** (your own OAuth app, registered in Workspace Settings, identified by a connector ID, retrieved with `getWorkspaceConnection()` — e.g. Databricks, Snowflake).
- **App user connectors**: Each signed-in app user has their own token (e.g. sending from their own Gmail). Start the flow from the frontend with `connectAppUser()`, then retrieve the token in a backend function with `getCurrentAppUserConnection()`.

## Contents
- [App User Connectors (`base44.connectors`)](#app-user-connectors-base44connectors)
- [Service Role Connectors (`base44.asServiceRole.connectors`)](#service-role-connectors-base44asserviceroleconnectors)
- [Metered Connectors](#metered-connectors)
- [Available Connectors](#available-connectors)
- [Type Definitions](#type-definitions)

---

## App User Connectors (`base44.connectors`)

Frontend methods for the current app user's own OAuth connection. Keyed by **connector ID** (a workspace-registered connector), not integration type.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `connectAppUser(connectorId)` | `Promise<string>` | Starts the OAuth flow; returns a redirect URL |
| `disconnectAppUser(connectorId)` | `Promise<void>` | Removes the current user's stored connection |

```javascript
// Start OAuth for the current app user
const redirectUrl = await base44.connectors.connectAppUser("abc123def");
window.location.href = redirectUrl;
```

```javascript
// Disconnect the app user's connection
await base44.connectors.disconnectAppUser("abc123def");
```

After the user completes the OAuth flow, retrieve their token from a backend function with the service role's `getCurrentAppUserConnection()` (below).

---

## Service Role Connectors (`base44.asServiceRole.connectors`)

**Backend/service role only.**

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConnection(integrationType)` | `Promise<ConnectorConnectionResponse>` | Shared token for a platform connector, by integration type |
| `getWorkspaceConnection(connectorId)` | `Promise<ConnectorConnectionResponse>` | Shared token for a workspace-registered connector, by connector ID |
| `getCurrentAppUserConnection(connectorId)` | `Promise<AppUserConnectorConnectionResponse>` | Per-app-user token for an app user connector, by connector ID |
| `callApi(integrationType, request)` | `Promise<ConnectorApiResponse>` | Calls a metered connector's API through the Base44 proxy |
| `getAccessToken(integrationType)` | `Promise<string>` | ⚠️ **Deprecated** — use `getConnection()` instead |

### getConnection(integrationType)

Shared OAuth token and config for a **platform connector** (one connected from the app's Integration settings), identified by [integration type](#available-connectors). All app users share this token.

```javascript
// Backend function only
export default async function (req) {
  const base44 = createClientFromRequest(req);

  const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getConnection("slack");

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ channel: "#general", text: "Hello from Base44!" })
  });

  return Response.json(await response.json());
}
```

```javascript
// Using connectionConfig (for services that need extra params, e.g. a subdomain)
const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getConnection("myservice");
const subdomain = connectionConfig?.subdomain;
const response = await fetch(`https://${subdomain}.example.com/api/v1/data`, {
  headers: { "Authorization": `Bearer ${accessToken}` }
});
```

```javascript
// Google Calendar example
const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");

const events = await fetch(
  "https://www.googleapis.com/calendar/v3/calendars/primary/events?" +
  new URLSearchParams({ maxResults: "10", orderBy: "startTime", singleEvents: "true", timeMin: new Date().toISOString() }),
  { headers: { "Authorization": `Bearer ${accessToken}` } }
).then(r => r.json());
```

### getWorkspaceConnection(connectorId)

Shared OAuth token and config for a **workspace-registered connector** (your own OAuth app, registered once in Workspace Settings and consented to by the app builder) — e.g. Databricks, Snowflake. Shared-token counterpart of `getCurrentAppUserConnection()`. Identified by **connector ID** (from the connector's settings page in Workspace Settings), not integration type.

```javascript
// Snowflake: retrieve the shared token and run a statement
const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getWorkspaceConnection("abc123def");

const response = await fetch(
  `https://${connectionConfig?.subdomain}.snowflakecomputing.com/api/v2/statements`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
```

### getCurrentAppUserConnection(connectorId)

Per-app-user OAuth token and config for an [app user connector](#app-user-connectors-base44connectors). Requires a client built with `createClientFromRequest(req)` so the runtime knows which app user's connection to resolve. The connector must be registered in Workspace Settings, and the app user must have completed `connectAppUser()` first.

```javascript
const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection("abc123def");

const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

---

## Metered Connectors

A few platform connectors are backed by paid third-party APIs that charge Base44 per call. For those, the OAuth token isn't available to your code — `getConnection()` rejects with a permission error. Call them with `callApi()` instead; Base44 attaches the credential server-side, forwards the request, and charges your workspace's credits. This applies to platform connectors only — workspace-registered and app user connectors run on your own OAuth app and keep normal token access.

### callApi(integrationType, request)

| Parameter | Type | Description | Required |
|---|---|---|---|
| `integrationType` | `string` | Integration type of a metered connector, e.g. `'x'` | Yes |
| `request.method` | `"GET" \| "POST" \| "PUT" \| "PATCH" \| "DELETE" \| "HEAD"` | Defaults to `'GET'` | No |
| `request.host` | `string` | Which of the connector's declared API hosts to use; omit for the default (first declared) | No |
| `request.path` | `string` | Path relative to the connector's API root, starting with `/` (not an absolute URL) | Yes |
| `request.query` | `Record<string, string \| number \| boolean \| Array<string \| number>>` | Query parameters, merged with any already in `path` | No |
| `request.headers` | `Record<string, string>` | Extra headers; only ones the connector allows are forwarded | No |
| `request.body` | `unknown` | JSON body, ignored for `GET`/`HEAD` | No |

**Returns:** `Promise<ConnectorApiResponse>`. Provider and transport outcomes come back in the response (`success`, `phase`, `status`), not thrown — only Base44-side failures (auth, quota, invalid proxy request) reject the promise. Only `phase: 'not_sent'` proves the provider never executed the request; `'timed_out'`/`'sent_unconfirmed'` may have executed upstream, so don't blindly retry non-idempotent calls on those.

```javascript
// Post to X
const res = await base44.asServiceRole.connectors.callApi("x", {
  method: "POST",
  path: "/2/tweets",
  body: { text: "Shipped!" },
});

if (!res.success) {
  console.error("X rejected the post", res.status, res.data);
}
```

```javascript
// Search and check the cost
const res = await base44.asServiceRole.connectors.callApi("x", {
  path: "/2/tweets/search/recent",
  query: { query: "base44", max_results: 10 },
});

console.log(`${res.creditsCharged} credits`, res.data);
```

Cost varies by endpoint, sometimes sharply for the same connector — avoid calling an expensive endpoint in a loop, and batch where the provider supports it. Each response reports its cost in `creditsCharged`.

---

## Available Connectors

Use the integration type with `getConnection()`/`callApi()` for platform connectors, or the connector ID with `getWorkspaceConnection()`/`getCurrentAppUserConnection()` for workspace-registered/app user connectors.

| Service | Type identifier |
|---------|----------------|
| Airtable | `airtable` |
| BambooHR | `bamboohr` |
| Box | `box` |
| Calendly | `calendly` |
| ClickUp | `clickup` |
| Contentful | `contentful` |
| Databricks | `databricks` |
| Discord | `discord` |
| Dropbox | `dropbox` |
| GitHub | `github` |
| GitLab | `gitlab` |
| Gmail | `gmail` |
| Google Ads | `googleads` |
| Google Analytics | `google_analytics` |
| Google BigQuery | `googlebigquery` |
| Google Calendar | `googlecalendar` |
| Google Classroom | `google_classroom` |
| Google Docs | `googledocs` |
| Google Drive | `googledrive` |
| Google Meet | `googlemeet` |
| Google Search Console | `google_search_console` |
| Google Sheets | `googlesheets` |
| Google Slides | `googleslides` |
| Google Tasks | `googletasks` |
| HubSpot | `hubspot` |
| Hugging Face | `hugging_face` |
| Instagram Business | `instagram` |
| Linear | `linear` |
| LinkedIn | `linkedin` |
| Microsoft Teams | `microsoft_teams` |
| Microsoft OneDrive | `one_drive` |
| Notion | `notion` |
| Outlook | `outlook` |
| QuickBooks | `quickbooks` |
| Salesforce | `salesforce` |
| SharePoint | `share_point` |
| Slack User | `slack` |
| Slack Bot | `slackbot` |
| Snowflake | `snowflake` |
| Splitwise | `splitwise` |
| Square | `square` |
| Supabase | `supabase` |
| TikTok | `tiktok` |
| Typeform | `typeform` |
| Wix | `wix` |
| Wrike | `wrike` |

Run `npx base44 connectors list-available` from the CLI to see all available types.

---

## Setup Requirements

1. **Builder plan** or higher
2. **Backend functions** enabled (for service role connectors)
3. **Connector configured** in Base44 dashboard (OAuth flow completed), or registered in Workspace Settings for workspace-registered/app user connectors

## Important Notes

- **Shared (service role) connectors**: One account per connector per app — all users share the same connected account.
- **App user connectors**: Each app user has their own token; start with `base44.connectors.connectAppUser()`, retrieve with the service role's `getCurrentAppUserConnection()`.
- **You handle the API calls**: for non-metered connectors, Base44 provides the token; you make the actual API requests. For metered connectors, use `callApi()` instead — you never see the token.
- **Token refresh**: Base44 handles token refresh automatically.

---

## Type Definitions

```typescript
/**
 * The type of external integration/connector (for service role connectors).
 * Examples: 'googlecalendar', 'slack', 'github', 'notion', etc.
 */
type ConnectorIntegrationType = string;

/** Connection details returned by getConnection() / getWorkspaceConnection(). */
interface ConnectorConnectionResponse {
  /** The OAuth access token for the external service. */
  accessToken: string;
  /** Key-value configuration for the connection, or null if not needed. */
  connectionConfig: Record<string, string> | null;
}

/** Connection details returned by getCurrentAppUserConnection(). */
interface AppUserConnectorConnectionResponse {
  accessToken: string;
  connectionConfig: Record<string, string> | null;
}

/** How far a metered connector call progressed through the Base44 proxy. */
type ConnectorApiResponsePhase = "not_sent" | "responded" | "timed_out" | "sent_unconfirmed";

/** A request to forward to a metered connector's API. */
interface ConnectorApiRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
  host?: string;
  /** Relative to the connector's API root, starting with '/'. Not an absolute URL. */
  path: string;
  query?: Record<string, string | number | boolean | Array<string | number>>;
  headers?: Record<string, string>;
  body?: unknown;
}

/** The upstream API's response, via the Base44 connector proxy. */
interface ConnectorApiResponse<T = unknown> {
  /** Whether the upstream API returned a 2xx status. */
  success: boolean;
  phase: ConnectorApiResponsePhase;
  status: number | null;
  /** Parsed response body, or null when the response is binary (see dataBase64). */
  data: T | null;
  /** Base64-encoded body for binary media types. Set instead of data. */
  dataBase64: string | null;
  contentType: string | null;
  /** Subset of upstream response headers the connector exposes, typically rate-limit counters. */
  headers: Record<string, string>;
  /** Credits charged to the workspace for this call. */
  creditsCharged: number;
}

/** Service role connectors module (app-scoped OAuth + metered calls). Backend only. */
interface ConnectorsModule {
  getConnection(integrationType: ConnectorIntegrationType): Promise<ConnectorConnectionResponse>;
  getWorkspaceConnection(connectorId: string): Promise<ConnectorConnectionResponse>;
  getCurrentAppUserConnection(connectorId: string): Promise<AppUserConnectorConnectionResponse>;
  callApi<T = unknown>(
    integrationType: ConnectorIntegrationType,
    request: ConnectorApiRequest
  ): Promise<ConnectorApiResponse<T>>;

  /** @deprecated Use getConnection() instead. */
  getAccessToken(integrationType: ConnectorIntegrationType): Promise<string>;
}

/** User-scoped connectors module for app user OAuth flows. Available via base44.connectors. */
interface UserConnectorsModule {
  /** Starts the OAuth flow for an app user connector; returns a redirect URL. */
  connectAppUser(connectorId: string): Promise<string>;
  /** Disconnects the current app user's connection for an app user connector. */
  disconnectAppUser(connectorId: string): Promise<void>;
}
```
