# Connectors Module

OAuth token management for external services. **Service role only** (backend functions).

## Method

```javascript
base44.asServiceRole.connectors.getAccessToken(integrationType): Promise<string>
```

Returns a raw OAuth access token for the specified service.

## Supported Services

| Integration Type | Service |
|-----------------|---------|
| `"googlecalendar"` | Google Calendar |
| `"googledrive"` | Google Drive |
| `"slack"` | Slack |
| `"notion"` | Notion |
| `"salesforce"` | Salesforce |
| `"hubspot"` | HubSpot |
| `"linkedin"` | LinkedIn |
| `"tiktok"` | TikTok |
| `"github"` | GitHub |

## Example Usage

```javascript
// Backend function only
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // Get OAuth token for Slack
  const slackToken = await base44.asServiceRole.connectors.getAccessToken("slack");
  
  // Use token directly with Slack API
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${slackToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      channel: "#general",
      text: "Hello from Base44!"
    })
  });
  
  return Response.json(await response.json());
});
```

## Google Calendar Example

```javascript
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const token = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
  
  // List upcoming events
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?" + 
    new URLSearchParams({
      maxResults: "10",
      orderBy: "startTime",
      singleEvents: "true",
      timeMin: new Date().toISOString()
    }),
    {
      headers: { "Authorization": `Bearer ${token}` }
    }
  );
  
  const events = await response.json();
  return Response.json(events);
});
```

## Setup Requirements

1. **Builder plan** or higher
2. **Backend functions** enabled
3. **Connector configured** in Base44 dashboard (OAuth flow completed)

## Important Notes

- **One account per connector per app**: All users share the same connected account
- **Backend only**: `connectors` module not available in frontend code
- **Service role required**: Must use `base44.asServiceRole.connectors`
- **You handle the API calls**: Base44 only provides the token; you make the actual API requests
- **Token refresh**: Base44 handles token refresh automatically

## Type Definitions

```typescript
/**
 * The type of external integration/connector.
 * Examples: 'googlecalendar', 'slack', 'github', 'notion', etc.
 */
type ConnectorIntegrationType = string;

/** Connectors module for managing OAuth tokens for external services. */
interface ConnectorsModule {
  /**
   * Retrieves an OAuth access token for a specific external integration type.
   * @param integrationType - The type of integration (e.g., 'googlecalendar', 'slack').
   * @returns Promise resolving to the access token string.
   */
  getAccessToken(integrationType: ConnectorIntegrationType): Promise<string>;
}
```
