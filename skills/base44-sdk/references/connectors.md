# Connectors Module

OAuth token management for external services. Unlike the `integrations` module (which provides pre-built functions), connectors give you raw OAuth tokens so you can call external service APIs directly.

There are two connector types:

- **Shared connectors** (`base44.asServiceRole.connectors`) — a single OAuth token shared by all app users. Best for shared service accounts (e.g. posting to a company Slack channel). **Backend/service role only.**
- **App user connectors** (`base44.connectors` for initiating the OAuth flow from the frontend; `base44.asServiceRole.connectors.getCurrentAppUserConnection()` on the backend) — each app user has their own OAuth token. Best for actions that need to happen as the individual user (e.g. sending from their own Gmail).

## Contents
- [Service Role Connectors (`base44.asServiceRole.connectors`)](#service-role-connectors-base44asserviceroleconnectors)
- [App User Connectors (`base44.connectors`)](#app-user-connectors-base44connectors)
- [Available Services](#available-services)
- [Type Definitions](#type-definitions)

---

## Service Role Connectors (`base44.asServiceRole.connectors`)

App-scoped OAuth tokens. **Backend/service role only.**

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConnection(integrationType)` | `Promise<ConnectorConnectionResponse>` | Get access token and optional connection config for a shared connector, by integration type |
| `getWorkspaceConnection(connectorId)` | `Promise<ConnectorConnectionResponse>` | Get access token and optional connection config for a workspace-registered connector, by connector ID |
| `getCurrentAppUserConnection(connectorId)` | `Promise<AppUserConnectorConnectionResponse>` | Get the current app user's OAuth token for an app user connector |
| `getAccessToken(integrationType)` | `Promise<string>` | ⚠️ **Deprecated** — use `getConnection()` instead |

### Examples

```javascript
// Backend function only
Deno.serve(async (req) => {
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
});
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
// Workspace-registered connector, by connector ID (not integration type)
const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getWorkspaceConnection("abc123def");

const response = await fetch(`https://${connectionConfig?.subdomain}.snowflakecomputing.com/api/v2/statements`, {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

```javascript
// App user connector: get the current app user's own token (backend only)
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req); // resolves the requesting app user

  const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection("abc123def");

  const events = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    headers: { Authorization: `Bearer ${accessToken}` }
  }).then(r => r.json());

  return Response.json(events);
});
```

---

## App User Connectors (`base44.connectors`)

Each signed-in app user has their own OAuth token. Register OAuth credentials for the service in Workspace Settings to get a **connector ID**, then use these frontend methods to let the user connect/disconnect their own account. On the backend, retrieve the current app user's token with `base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId)` (see above) — this requires `createClientFromRequest(req)` so the SDK knows which app user to act on behalf of.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `connectAppUser(connectorId)` | `Promise<string>` | Get the OAuth redirect URL to start the app user's connection flow |
| `disconnectAppUser(connectorId)` | `Promise<void>` | Remove the current app user's stored connection |

### Examples

```javascript
// Frontend: start the OAuth flow for the current app user
const redirectUrl = await base44.connectors.connectAppUser("abc123def");
window.location.href = redirectUrl;

// Frontend: disconnect the current app user's connection
await base44.connectors.disconnectAppUser("abc123def");
```

---

## Available Services

All services below support both shared connectors (`getConnection()`) and app user connectors (register in Workspace Settings, then `connectAppUser()` / `getCurrentAppUserConnection()`).

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
3. **Connector configured** in Base44 dashboard (OAuth flow completed)

## Important Notes

- **Service role connectors**: One account per connector per app — all users share the same connected account
- **You handle the API calls**: Base44 provides the token; you make the actual API requests
- **Token refresh**: Base44 handles token refresh automatically

---

## Type Definitions

```typescript
/**
 * The type of external integration/connector (for service role connectors).
 * Examples: 'googlecalendar', 'slack', 'github', 'notion', etc.
 */
type ConnectorIntegrationType = string;

/** Connection details returned by getConnection() and getWorkspaceConnection(). */
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

/** Service role connectors module (app-scoped OAuth). Backend only. */
interface ConnectorsModule {
  /**
   * Retrieves the shared OAuth access token and optional connection config, by integration type.
   * @param integrationType - e.g., 'googlecalendar', 'slack', 'github'.
   */
  getConnection(integrationType: ConnectorIntegrationType): Promise<ConnectorConnectionResponse>;

  /**
   * Retrieves the OAuth access token and optional connection config for a workspace-registered
   * connector, by connector ID (the `OrganizationConnector` database ID).
   */
  getWorkspaceConnection(connectorId: string): Promise<ConnectorConnectionResponse>;

  /**
   * Retrieves the current app user's OAuth access token and optional connection config for an
   * app user connector. Requires a client created with `createClientFromRequest(req)` so the SDK
   * knows which app user to act on behalf of.
   */
  getCurrentAppUserConnection(connectorId: string): Promise<AppUserConnectorConnectionResponse>;

  /**
   * @deprecated Use getConnection() instead.
   * Retrieves only the OAuth access token string.
   */
  getAccessToken(integrationType: ConnectorIntegrationType): Promise<string>;
}

/** User-scoped connectors module for app user OAuth flows. Available via `base44.connectors`. */
interface UserConnectorsModule {
  /** Gets the OAuth redirect URL to start the app user's connection flow for a connector. */
  connectAppUser(connectorId: string): Promise<string>;

  /** Removes the current app user's stored connection for a connector. */
  disconnectAppUser(connectorId: string): Promise<void>;
}

```
