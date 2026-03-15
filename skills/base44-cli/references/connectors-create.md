# Creating Connectors

Connectors are OAuth integrations that let your Base44 app connect to external services like Google Calendar, Slack, Notion, and more. Once connected, you can use access tokens in backend functions to call external APIs directly.

## Key Concepts

- **Direct API Access**: Connectors provide raw OAuth access tokens - you call the external APIs directly from backend functions
- **App Builder's Account**: Connects your account (the app builder), not your end users' accounts
- **Backend Functions Only**: Tokens are only accessible server-side for security

## File Location

Create connector files in the `base44/connectors/` directory (or the directory specified by `connectorsDir` in your config.jsonc).

**File naming:** `{type}.jsonc` or `{type}.json`

Examples:
- `base44/connectors/googlecalendar.jsonc`
- `base44/connectors/slack.jsonc`
- `base44/connectors/notion.json`

## Schema

Each connector file must specify a `type` and optionally a list of `scopes`:

```jsonc
{
  "type": "googlecalendar",
  "scopes": [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events"
  ]
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | The integration type (see supported types below) |
| `scopes` | string[] | No | OAuth scopes to request (defaults to `[]`) |

## Supported Connector Types

| Service | Type | Scopes Documentation |
|---------|------|---------------------|
| Google Calendar | `googlecalendar` | [Google Calendar Scopes](https://developers.google.com/identity/protocols/oauth2/scopes#calendar) |
| Google Drive | `googledrive` | [Google Drive Scopes](https://developers.google.com/identity/protocols/oauth2/scopes#drive) |
| Google Sheets | `googlesheets` | [Google Sheets Scopes](https://developers.google.com/identity/protocols/oauth2/scopes#sheets) |
| Google Docs | `googledocs` | [Google Docs Scopes](https://developers.google.com/identity/protocols/oauth2/scopes#docs) |
| Google Slides | `googleslides` | [Google Slides Scopes](https://developers.google.com/identity/protocols/oauth2/scopes#slides) |
| Gmail | `gmail` | [Gmail Scopes](https://developers.google.com/identity/protocols/oauth2/scopes#gmail) |
| Slack | `slack` | [Slack Scopes](https://api.slack.com/scopes) |
| Notion | `notion` | [Notion Authorization](https://developers.notion.com/docs/authorization) |
| Salesforce | `salesforce` | [Salesforce Scopes](https://developer.salesforce.com/docs/platform/mobile-sdk/guide/oauth-scope-parameter-values.html) |
| HubSpot | `hubspot` | [HubSpot Scopes](https://developers.hubspot.com/docs/api/scopes) |
| LinkedIn | `linkedin` | [LinkedIn Scopes](https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access) |
| TikTok | `tiktok` | [TikTok Scopes](https://developers.tiktok.com/doc/scopes-overview) |

## Examples

### Google Calendar (Read and Write Events)

```jsonc
// base44/connectors/googlecalendar.jsonc
{
  "type": "googlecalendar",
  "scopes": [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events"
  ]
}
```

### Slack (Send Messages and Read Channels)

```jsonc
// base44/connectors/slack.jsonc
{
  "type": "slack",
  "scopes": [
    "chat:write",
    "channels:read"
  ]
}
```

### Notion (Default Access)

```jsonc
// base44/connectors/notion.jsonc
{
  "type": "notion",
  "scopes": []
}
```

Note: Notion uses a page-based access model where users select which pages to share during OAuth authorization.

### Google Sheets (Read Only)

```jsonc
// base44/connectors/googlesheets.jsonc
{
  "type": "googlesheets",
  "scopes": [
    "https://www.googleapis.com/auth/spreadsheets.readonly"
  ]
}
```

## Rules and Constraints

1. **One connector per type**: You cannot have multiple connectors of the same type (e.g., two `googlecalendar` connectors)

2. **Type must be valid**: The `type` field must be one of the supported connector types listed above

3. **Scopes are provider-specific**: Each service has its own scope format - refer to the provider's documentation

## Next Steps

After creating connector files, push them to Base44:

```bash
npx base44 connectors push
```

This will prompt you to authorize each new connector in your browser. See [connectors-push.md](connectors-push.md) for details.

To pull existing connectors from Base44 to local files:

```bash
npx base44 connectors pull
```

See [connectors-pull.md](connectors-pull.md) for details.
