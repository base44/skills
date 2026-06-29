# base44 connectors initiate

Initialize a connector on an app and start its OAuth flow. Works without a local project directory when `--app-id` is provided.

## Syntax

```bash
npx base44 connectors initiate --integration-type <type> [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--integration-type <type>` | Integration type to initiate (e.g. `googlecalendar`, `gmail`, `slack`) | Yes |
| `--scopes <scopes...>` | OAuth scopes to request (space- or comma-separated) | No |

## Examples

```bash
# Initiate Google Calendar connector on a specific app (no local project needed)
npx base44 connectors initiate --app-id app_123 --integration-type googlecalendar

# With specific OAuth scopes (space-separated)
npx base44 connectors initiate --integration-type googlecalendar --scopes https://www.googleapis.com/auth/calendar

# Multiple scopes, comma-separated
npx base44 connectors initiate --integration-type gmail --scopes scope.a,scope.b
```

## Behavior

1. Sends an initiate request to Base44 for the specified integration type
2. If the connector is already authorized, reports so and suggests running `connectors pull`
3. If authorization is needed, provides a redirect URL for the OAuth flow:
   - **Interactive mode**: Logs the URL, opens the browser, and polls until authorized
   - **Non-interactive mode** (no TTY / `--app-id` only): Prints the URL and returns — open it manually to authorize
   - **JSON mode** (`--json`): Returns the URL in structured output without opening a browser

## JSON Mode Output (`--json`)

```json
{
  "integrationType": "googlecalendar",
  "alreadyAuthorized": false,
  "redirectUrl": "https://auth.base44.io/oauth/...",
  "connectionId": "conn_123"
}
```

After opening the redirect URL and completing the OAuth flow, run `npx base44 connectors pull` to fetch the connector config.

## Notes

- Does not require a local project directory — can be used with `--app-id` or `BASE44_APP_ID`
- Run `npx base44 connectors list-available` to see all supported integration types
- After successful authorization, run `npx base44 connectors pull` to sync config locally

## Related Commands

- [connectors-list-available.md](connectors-list-available.md) - List all available integration types
- [connectors-pull.md](connectors-pull.md) - Pull connectors from Base44 to local files
- [connectors-push.md](connectors-push.md) - Push local connectors to Base44
