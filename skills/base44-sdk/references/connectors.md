# Connectors Module

OAuth token management for external services. Connectors come in two scopes:

- **`base44.asServiceRole.connectors`** — App-scoped OAuth tokens (backend/service role only). All users share the same connected account.
- **`base44.connectors`** — App-user-scoped OAuth tokens (frontend). Each signed-in app user authorizes and holds their own connection.

## Contents
- [Service Role Connectors (`base44.asServiceRole.connectors`)](#service-role-connectors-base44asserviceroleconnectors)
- [App User Connectors (`base44.connectors`)](#app-user-connectors-base44connectors)
- [Metered Connectors](#metered-connectors)
- [Available Services](#available-services)
- [Setup Requirements](#setup-requirements)
- [Important Notes](#important-notes)
- [Type Definitions](#type-definitions)

---

## Service Role Connectors (`base44.asServiceRole.connectors`)

App-scoped OAuth tokens. **Backend/service role only.**

Shared connectors come in two forms, both returning an app-wide token shared by all users — they differ only in how you identify the connector:

- **Platform connectors** — connected from the app's Integration settings or with the `connectors push` CLI command, identified by an **integration type** string (e.g. `'slack'`). Retrieve with `getConnection(integrationType)`.
- **Workspace-registered connectors** — backed by your own OAuth app, registered once in Workspace Settings and consented to by the app builder, identified by a **connector ID** instead of an integration type. Retrieve with `getWorkspaceConnection(connectorId)`. Connectors whose OAuth app is specific to your own account, such as Databricks and Snowflake, work this way.

This module also exposes `getCurrentAppUserConnection(connectorId)`, which retrieves an individual **app user's** token (not app-wide) — see [App User Connectors](#app-user-connectors-base44connectors) below for the full flow.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConnection(integrationType)` | `Promise<ConnectorConnectionResponse>` | Get access token + optional config for a platform connector |
| `getWorkspaceConnection(connectorId)` | `Promise<ConnectorConnectionResponse>` | Get access token + optional config for a workspace-registered connector (by connector ID) |
| `getCurrentAppUserConnection(connectorId)` | `Promise<AppUserConnectorConnectionResponse>` | Get the **current app user's** access token + optional config for an app user connector |
| `callApi(integrationType, request)` | `Promise<ConnectorApiResponse<T>>` | Call a [metered connector's](#metered-connectors) API through the Base44 proxy — no token handling needed |
| `getAccessToken(integrationType)` | `Promise<string>` | ⚠️ **Deprecated** — use `getConnection()` instead |

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
// Workspace-registered connector (e.g. Snowflake), identified by connector ID, not integration type
const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getWorkspaceConnection("abc123def");

const response = await fetch(
  `https://${connectionConfig?.subdomain}.snowflakecomputing.com/api/v2/statements`,
  { headers: { "Authorization": `Bearer ${accessToken}` } }
).then(r => r.json());
```

```javascript
// Reading an app user's own connection from a backend function
// (the client must be created with createClientFromRequest so the runtime
// knows which app user's connection to resolve)
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

Each signed-in app user has their own OAuth token, separate from every other user. Use this when the user needs to act as themself — for example, sending email from their own Gmail account or posting to their personal LinkedIn. **Frontend only** (the resulting token is read on the backend via `getCurrentAppUserConnection()`, above).

### Setup flow

1. **Register OAuth credentials** for the service in Workspace Settings to get a **connector ID**. Requires workspace admin access.
2. **Frontend:** call `connectAppUser(connectorId)` to get an authorization URL, then redirect the app user there to complete the OAuth flow.
3. **Backend:** call `base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId)` (using a client created with `createClientFromRequest`) to retrieve the signed-in user's token.
4. Use the returned `accessToken` (and `connectionConfig`, if present) to call the external service's API directly.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `connectAppUser(connectorId)` | `Promise<string>` | Starts the OAuth flow for the current app user; returns a redirect URL to send them to |
| `disconnectAppUser(connectorId)` | `Promise<void>` | Removes the current app user's OAuth connection for the connector |

### Examples

```javascript
// Frontend: start the OAuth flow for the signed-in app user
const redirectUrl = await base44.connectors.connectAppUser("abc123def");
window.location.href = redirectUrl;
```

```javascript
// Frontend: let the user disconnect their account
await base44.connectors.disconnectAppUser("abc123def");
```

```javascript
// Backend: use the connector ID to fetch that user's token once connected
export default async function (req) {
  const base44 = createClientFromRequest(req);
  const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection("abc123def");
  // ...call the external API with accessToken
}
```

---

## Metered Connectors

A few platform connectors are backed by paid third-party APIs that charge Base44 per call (e.g. `x`). For those, the OAuth token isn't available to your code and `getConnection()` rejects with a permission error — call them with `callApi()` instead. Base44 attaches the credential server-side, forwards the request, and charges the call to your workspace's credits.

This applies to platform connectors only. Workspace-registered and app user connectors run on your own OAuth app, so there's nothing for Base44 to meter — those keep normal token access through `getWorkspaceConnection()` and `getCurrentAppUserConnection()`.

### Example

```javascript
// Post to X (Twitter) through the metered proxy
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

### Things to keep in mind

- **Cost varies sharply by endpoint.** The same connector can charge far more for one endpoint than another — avoid calling an expensive endpoint in a loop, and batch where the provider supports it. Each response reports its cost in `creditsCharged`.
- **Provider and transport outcomes are returned, not thrown.** A provider `4xx`/`5xx`, or a connection failure, comes back as `success: false` with a `phase`. Only Base44-side failures (auth, quota, invalid request) reject the promise.
- **Only `phase: 'not_sent'` proves the provider never executed the request.** `timed_out` and `sent_unconfirmed` may have executed upstream — don't blindly retry non-idempotent calls based on them.
- **Binary responses** (images, PDFs) come back in `dataBase64` + `contentType` instead of `data`.

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

Run `npx base44 connectors list-available` from the CLI to see all available types. Databricks and Snowflake are normally used as workspace-registered connectors (by connector ID via `getWorkspaceConnection()`/`getCurrentAppUserConnection()`) rather than by integration type.

If you're working in a TypeScript project, generate types from your app's connector configuration (via the CLI's `types generate` command) to get autocomplete on integration type names when calling `getConnection()`.

---

## Setup Requirements

1. **Builder plan** or higher
2. **Backend functions** enabled (for service role connectors)
3. **Connector configured** in Base44 dashboard (platform connectors) or registered in Workspace Settings (workspace-registered / app user connectors), with the OAuth flow completed

## Important Notes

- **Service role (shared) connectors**: One account per connector per app — all users share the same connected account
- **App user connectors**: Each signed-in app user authorizes and holds their own token, independent of other users
- **You handle the API calls**: Base44 provides the token (or, for metered connectors, proxies the call); you make or receive the actual API request
- **Token refresh**: Base44 handles token refresh automatically
- **Metered connectors**: A small set of platform connectors can only be called via `callApi()` — `getConnection()` rejects with a permission error for these

---

## Type Definitions

```typescript
/**
 * The type of external integration/connector (for platform connectors).
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

/** A request to forward to a metered connector's API through the Base44 proxy. */
interface ConnectorApiRequest {
  /** HTTP method for the upstream request. Defaults to 'GET'. */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
  /** Which of the connector's declared API hosts to call. Omit to use the default (first declared) host. */
  host?: string;
  /** Path relative to the connector's API root, starting with '/'. Must not be an absolute URL. */
  path: string;
  /** Query parameters, merged into the URL with any already present in `path`. */
  query?: Record<string, string | number | boolean | Array<string | number>>;
  /** Extra request headers. Only connector-allowlisted headers are forwarded. */
  headers?: Record<string, string>;
  /** JSON request body. Ignored for GET and HEAD. */
  body?: unknown;
}

/** The upstream API's response, as returned by the Base44 connector proxy. */
interface ConnectorApiResponse<T = unknown> {
  /** Whether the upstream API returned a 2xx status. Proxy and upstream errors set this to false. */
  success: boolean;
  /** How far the call progressed (see Metered Connectors above). */
  phase: ConnectorApiResponsePhase;
  /** The upstream HTTP status code, or null if no response was received. */
  status: number | null;
  /** The parsed upstream response body, or proxy error details if no response. Null when the body is binary (see dataBase64). */
  data: T | null;
  /** The response body base64-encoded, for media types the connector declares as binary (e.g. images, PDFs). Set instead of `data`, never alongside it. */
  dataBase64: string | null;
  /** The response media type, set only alongside dataBase64. */
  contentType: string | null;
  /** The subset of upstream response headers the connector exposes (typically rate-limit counters). */
  headers: Record<string, string>;
  /** Credits charged to the workspace for this call. */
  creditsCharged: number;
}

/** Service role connectors module (app-scoped OAuth). Backend only. */
interface ConnectorsModule {
  /**
   * Retrieves the OAuth access token and optional connection config for a platform connector.
   * @param integrationType - e.g., 'googlecalendar', 'slack', 'github'.
   */
  getConnection(integrationType: ConnectorIntegrationType): Promise<ConnectorConnectionResponse>;

  /**
   * Retrieves the OAuth access token and optional connection config for a workspace-registered connector.
   * @param connectorId - The connector's ID from Workspace Settings (not an integration type string).
   */
  getWorkspaceConnection(connectorId: string): Promise<ConnectorConnectionResponse>;

  /**
   * Retrieves the current app user's OAuth access token and optional connection config
   * for an app user connector. Requires a client created with createClientFromRequest.
   * @param connectorId - The connector's ID from Workspace Settings (not an integration type string).
   */
  getCurrentAppUserConnection(connectorId: string): Promise<AppUserConnectorConnectionResponse>;

  /**
   * Calls a metered connector's API through the Base44 proxy. Base44 attaches the
   * credential server-side and charges the call to the workspace's credits.
   * @param integrationType - The integration type of a metered connector, e.g. 'x'.
   * @param request - The upstream request to forward.
   */
  callApi<T = unknown>(
    integrationType: ConnectorIntegrationType,
    request: ConnectorApiRequest
  ): Promise<ConnectorApiResponse<T>>;

  /**
   * @deprecated Use getConnection() instead.
   * Retrieves only the OAuth access token string.
   */
  getAccessToken(integrationType: ConnectorIntegrationType): Promise<string>;
}

/**
 * App-user-scoped connectors module (frontend, per-user OAuth).
 * Available via `base44.connectors`.
 */
interface UserConnectorsModule {
  /**
   * Starts the OAuth flow for the current app user and returns a redirect URL.
   * @param connectorId - The connector's ID from Workspace Settings.
   */
  connectAppUser(connectorId: string): Promise<string>;

  /**
   * Disconnects the current app user's OAuth connection for a connector.
   * @param connectorId - The connector's ID from Workspace Settings.
   */
  disconnectAppUser(connectorId: string): Promise<void>;
}
```
