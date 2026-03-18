# Connectors Module

OAuth token management for external services. The SDK exposes **two** connectors modules:

- **`base44.connectors`** — User-scoped OAuth flows (frontend & backend). Manages per-user connections.
- **`base44.asServiceRole.connectors`** — App-scoped OAuth tokens (backend/service role only). All users share the same connected account.

## Contents
- [User Connectors (`base44.connectors`)](#user-connectors-base44connectors)
- [Service Role Connectors (`base44.asServiceRole.connectors`)](#service-role-connectors-base44asserviceroleconnectors)
- [Available Services](#available-services)
- [Type Definitions](#type-definitions)

---

## User Connectors (`base44.connectors`)

Per-user OAuth flows. Each end user has their own connection. Available in frontend and backend.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getCurrentAppUserAccessToken(connectorId)` | `Promise<string>` | Get OAuth access token for the current user's connection |
| `connectAppUser(connectorId)` | `Promise<string>` | Initiate OAuth flow — returns redirect URL |
| `disconnectAppUser(connectorId)` | `Promise<void>` | Remove current user's OAuth connection |

> **Note:** `connectorId` is the OrgConnector database ID (set in the Base44 dashboard), not the integration type string.

### Examples

```javascript
// Check if the current user has connected — get their token
const token = await base44.connectors.getCurrentAppUserAccessToken("abc123def");

const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
  headers: { "Authorization": `Bearer ${token}` }
});
```

```javascript
// Initiate OAuth flow — redirect the user to authorize
const redirectUrl = await base44.connectors.connectAppUser("abc123def");
window.location.href = redirectUrl;
```

```javascript
// Disconnect the current user's OAuth connection
await base44.connectors.disconnectAppUser("abc123def");
```

---

## Service Role Connectors (`base44.asServiceRole.connectors`)

App-scoped OAuth tokens. The app builder connects the account once; all users share it. **Backend/service role only.**

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConnection(integrationType)` | `Promise<ConnectorConnectionResponse>` | Get access token and optional connection config |
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

---

## Available Services

| Service | Type identifier |
|---------|----------------|
| Airtable | `airtable` |
| Box | `box` |
| ClickUp | `clickup` |
| Discord | `discord` |
| Dropbox | `dropbox` |
| GitHub | `github` |
| Gmail | `gmail` |
| Google Analytics | `google_analytics` |
| Google BigQuery | `googlebigquery` |
| Google Calendar | `googlecalendar` |
| Google Classroom | `google_classroom` |
| Google Docs | `googledocs` |
| Google Drive | `googledrive` |
| Google Search Console | `google_search_console` |
| Google Sheets | `googlesheets` |
| Google Slides | `googleslides` |
| HubSpot | `hubspot` |
| Linear | `linear` |
| LinkedIn | `linkedin` |
| Microsoft Teams | `microsoft_teams` |
| Microsoft OneDrive | `one_drive` |
| Notion | `notion` |
| Outlook | `outlook` |
| Salesforce | `salesforce` |
| SharePoint | `share_point` |
| Slack User | `slack` |
| Slack Bot | `slackbot` |
| Splitwise | `splitwise` |
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
- **User connectors**: Each end user connects their own account
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

/** Connection details returned by getConnection(). */
interface ConnectorConnectionResponse {
  /** The OAuth access token for the external service. */
  accessToken: string;
  /** Key-value configuration for the connection, or null if not needed. */
  connectionConfig: Record<string, string> | null;
}

/** Service role connectors module (app-scoped OAuth). Backend only. */
interface ConnectorsModule {
  /**
   * Retrieves the OAuth access token and optional connection config.
   * @param integrationType - e.g., 'googlecalendar', 'slack', 'github'.
   */
  getConnection(integrationType: ConnectorIntegrationType): Promise<ConnectorConnectionResponse>;

  /**
   * @deprecated Use getConnection() instead.
   * Retrieves only the OAuth access token string.
   */
  getAccessToken(integrationType: ConnectorIntegrationType): Promise<string>;
}

/** User connectors module (per-user OAuth). Frontend and backend. */
interface UserConnectorsModule {
  /**
   * Retrieves the OAuth access token for the current user's connection.
   * @param connectorId - The OrgConnector database ID.
   */
  getCurrentAppUserAccessToken(connectorId: string): Promise<string>;

  /**
   * Initiates OAuth flow for the current user. Returns a redirect URL.
   * @param connectorId - The OrgConnector database ID.
   */
  connectAppUser(connectorId: string): Promise<string>;

  /**
   * Removes the current user's OAuth connection.
   * @param connectorId - The OrgConnector database ID.
   */
  disconnectAppUser(connectorId: string): Promise<void>;
}
```
