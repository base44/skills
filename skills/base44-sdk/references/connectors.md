# Connectors Module

OAuth token management for external services. Connectors come in two flavors:

- **Shared connectors** — a single OAuth token shared by all app users (e.g. a company Slack channel).
- **App user connectors** — each app user has their own OAuth token (e.g. acting as the signed-in user's Gmail account).

Modules:
- **`base44.asServiceRole.connectors`** — Retrieves tokens for both shared and app-user connectors, and calls metered connectors. **Backend/service role only.**
- **`base44.connectors`** — Frontend-callable methods to start/stop an app user's OAuth connection.

## Contents
- [Service Role Connectors (`base44.asServiceRole.connectors`)](#service-role-connectors-base44asserviceroleconnectors)
  - [Shared Connectors](#shared-connectors)
  - [App User Connectors (service role)](#app-user-connectors-service-role)
  - [Metered Connectors](#metered-connectors)
- [App User Connectors (`base44.connectors`)](#app-user-connectors-base44connectors)
- [Available Services](#available-services)
- [Type Definitions](#type-definitions)

---

## Service Role Connectors (`base44.asServiceRole.connectors`)

**Backend/service role only.**

### Shared Connectors

A single OAuth token shared by all app users. Two forms, both returning the same shape:

- **Platform connectors** — connected from the app's Integration settings (or the `connectors push` CLI command), identified by an [integration type](#available-services) string. Use `getConnection()`.
- **Workspace-registered connectors** — backed by your own OAuth app, registered once in Workspace Settings, identified by a connector ID instead of an integration type (e.g. Databricks, Snowflake). Use `getWorkspaceConnection()`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConnection(integrationType)` | `Promise<ConnectorConnectionResponse>` | Get access token and optional connection config for a platform connector |
| `getWorkspaceConnection(connectorId)` | `Promise<ConnectorConnectionResponse>` | Get access token and optional connection config for a workspace-registered connector, by connector ID |
| `getAccessToken(integrationType)` | `Promise<string>` | ⚠️ **Deprecated** — use `getConnection()` instead |

### App User Connectors (service role)

Each app user has their own OAuth token. The connector must be registered in Workspace Settings, and the app user must have completed the OAuth flow via [`connectAppUser()`](#app-user-connectors-base44connectors). Requires a client created with `createClientFromRequest(req)` so the SDK knows which app user to act as.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getCurrentAppUserConnection(connectorId)` | `Promise<AppUserConnectorConnectionResponse>` | Get the current app user's access token and optional connection config, by connector ID |
| `getCurrentAppUserAccessToken(connectorId)` | `Promise<string>` | ⚠️ **Deprecated** (and internal) — use `getCurrentAppUserConnection()` instead |

### Metered Connectors

A few platform connectors are backed by paid third-party APIs that Base44 charges per call (e.g. `x`). For those, the OAuth token isn't available to your code — `getConnection()` rejects with a permission error. Call them through the proxy instead:

| Method | Signature | Description |
|--------|-----------|-------------|
| `callApi(integrationType, request)` | `Promise<ConnectorApiResponse<T>>` | Forwards a request to the connector's upstream API; Base44 attaches the credential and charges your workspace's credits |

`request` is `{ method?, host?, path, query?, headers?, body? }` — `path` is required and relative to the connector's API root (e.g. `/2/tweets`); `method` defaults to `'GET'` and must be one of `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`.

The response reports upstream/proxy outcomes in the body rather than via HTTP status — only Base44-side failures (auth, quota, invalid request) reject the promise. A provider 4xx/5xx or a transport failure resolves with `success: false` and a `phase` (`'not_sent' | 'responded' | 'timed_out' | 'sent_unconfirmed'`). Only `phase: 'not_sent'` proves the provider never ran the request, so don't blindly retry non-idempotent calls on `'timed_out'` or `'sent_unconfirmed'`.

```javascript
// Metered connector example
const res = await base44.asServiceRole.connectors.callApi("x", {
  method: "POST",
  path: "/2/tweets",
  body: { text: "Shipped!" },
});

if (!res.success) {
  console.error("X rejected the post", res.status, res.data);
} else {
  console.log(`${res.creditsCharged} credits`, res.data);
}
```

### Examples

```javascript
// Backend function only
export default async function (req) {
  const base44 = createClientFromRequest(req);

  // Recommended: use getConnection() for token + optional config
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

```javascript
// Workspace-registered connector (e.g. Snowflake), by connector ID
const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getWorkspaceConnection("abc123def");

const response = await fetch(
  `https://${connectionConfig?.subdomain}.snowflakecomputing.com/api/v2/statements`,
  { headers: { "Authorization": `Bearer ${accessToken}` } }
);
```

```javascript
// App user connector — acting as the signed-in app user, by connector ID
export default async function (req) {
  const base44 = createClientFromRequest(req);

  const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection("abc123def");

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });

  return Response.json(await response.json());
}
```

---

## App User Connectors (`base44.connectors`)

Frontend-callable methods for each app user to grant or revoke their own OAuth connection to a connector configured in Workspace Settings. Identified by connector ID (not integration type).

| Method | Signature | Description |
|--------|-----------|-------------|
| `connectAppUser(connectorId)` | `Promise<string>` | Starts the OAuth flow; resolves to a redirect URL to send the app user to |
| `disconnectAppUser(connectorId)` | `Promise<void>` | Removes the current app user's stored OAuth credentials for the connector |

```javascript
// Frontend: start the OAuth flow for the app user
const redirectUrl = await base44.connectors.connectAppUser("abc123def");
window.location.href = redirectUrl;
```

```javascript
// Frontend: disconnect the app user's connection
await base44.connectors.disconnectAppUser("abc123def");
```

After `connectAppUser()` completes, retrieve the resulting token from a backend function with `getCurrentAppUserConnection()` (see above).

---

## Available Services

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

Run `npx base44 connectors list-available` from the CLI to see all available types. Metered connectors (currently `x`) are called with `callApi()` instead of `getConnection()` — see [Metered Connectors](#metered-connectors).

---

## Setup Requirements

1. **Builder plan** or higher
2. **Backend functions** enabled (for service role connectors)
3. **Connector configured** in Base44 dashboard (OAuth flow completed) for shared connectors, or registered in Workspace Settings (requires workspace admin access) for workspace-registered/app user connectors

## Important Notes

- **Shared connectors**: One account per connector per app — all users share the same connected account
- **App user connectors**: Each signed-in app user authenticates separately via `connectAppUser()`; tokens are retrieved per-user with `getCurrentAppUserConnection()`
- **You handle the API calls**: Base44 provides the token; you make the actual API requests (except for metered connectors, where `callApi()` makes the call for you)
- **Token refresh**: Base44 handles token refresh automatically
- **Metered connectors**: cost varies a lot by endpoint — avoid calling them in a loop, and check `creditsCharged` on the response

---

## Type Definitions

```typescript
/**
 * The type of external integration/connector (for shared/platform connectors).
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
  /** The OAuth access token for the app user's connection. */
  accessToken: string;
  /** Key-value configuration for the connection, or null if not needed. */
  connectionConfig: Record<string, string> | null;
}

/** How far a metered connector call progressed through the Base44 proxy. */
type ConnectorApiResponsePhase = "not_sent" | "responded" | "timed_out" | "sent_unconfirmed";

/** A request to forward to a metered connector's API. */
interface ConnectorApiRequest {
  /** HTTP method for the upstream request. Defaults to 'GET'. */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
  /** Which of the connector's declared API hosts to call. Omit to use the default (first declared) host. */
  host?: string;
  /** Path relative to the connector's API root, starting with '/', e.g. '/2/tweets'. Not an absolute URL. */
  path: string;
  /** Query parameters, merged with any already in `path`. */
  query?: Record<string, string | number | boolean | Array<string | number>>;
  /** Extra request headers. Only connector-allowed headers are forwarded. */
  headers?: Record<string, string>;
  /** JSON request body. Ignored for GET and HEAD. */
  body?: unknown;
}

/** The upstream API's response, via the Base44 connector proxy. */
interface ConnectorApiResponse<T = unknown> {
  /** Whether the upstream API returned a 2xx status. */
  success: boolean;
  /** How far the call progressed. */
  phase: ConnectorApiResponsePhase;
  /** The upstream HTTP status code, or null when no response was received. */
  status: number | null;
  /** The parsed response body, or null when the response is binary (see dataBase64). */
  data: T | null;
  /** The response body base64-encoded, for binary media types (e.g. images, PDFs). */
  dataBase64: string | null;
  /** The response media type, set only alongside dataBase64. */
  contentType: string | null;
  /** The subset of upstream response headers the connector exposes (e.g. rate-limit counters). */
  headers: Record<string, string>;
  /** Credits charged to the workspace for this call. */
  creditsCharged: number;
}

/** Service role connectors module (app-scoped and app-user OAuth, plus metered calls). Backend only. */
interface ConnectorsModule {
  /** Get access token + connection config for a platform connector, by integration type. */
  getConnection(integrationType: ConnectorIntegrationType): Promise<ConnectorConnectionResponse>;

  /** Get access token + connection config for a workspace-registered connector, by connector ID. */
  getWorkspaceConnection(connectorId: string): Promise<ConnectorConnectionResponse>;

  /**
   * @deprecated Use getConnection() instead.
   * Retrieves only the OAuth access token string.
   */
  getAccessToken(integrationType: ConnectorIntegrationType): Promise<string>;

  /** Get the current app user's access token + connection config, by connector ID. */
  getCurrentAppUserConnection(connectorId: string): Promise<AppUserConnectorConnectionResponse>;

  /**
   * @deprecated Use getCurrentAppUserConnection() instead.
   */
  getCurrentAppUserAccessToken(connectorId: string): Promise<string>;

  /** Call a metered connector's upstream API through the Base44 proxy. */
  callApi<T = unknown>(
    integrationType: ConnectorIntegrationType,
    request: ConnectorApiRequest
  ): Promise<ConnectorApiResponse<T>>;
}

/** User-scoped connectors module (app-user OAuth flows). Available via base44.connectors. */
interface UserConnectorsModule {
  /** Starts the OAuth flow for an app user connector; resolves to a redirect URL. */
  connectAppUser(connectorId: string): Promise<string>;

  /** Disconnects the current app user's OAuth connection for a connector. */
  disconnectAppUser(connectorId: string): Promise<void>;
}
```
