# base44 connectors initiate

Initialize a connector on an app and start its OAuth flow. Works without a local project — pass `--app-id` or set `BASE44_APP_ID`.

## Syntax

```bash
npx base44 connectors initiate --integration-type <type> [--scopes <scopes...>]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--integration-type <type>` | Integration type to initiate (e.g. `googlecalendar`, `gmail`, `slack`) | Yes |
| `--scopes <scopes...>` | OAuth scopes to request (space- or comma-separated) | No |

## What It Does

1. Calls the Base44 API to initialize the connector for the given integration type
2. If the connector is already authorized, reports that and exits (run `connectors pull` to fetch its config)
3. Otherwise, opens a browser window for OAuth authorization (interactive mode) or prints the authorization URL (non-interactive / `--json` mode)
4. In interactive mode, polls until authorization completes

## Examples

```bash
# Initialize Google Calendar connector (no scopes — uses provider defaults)
npx base44 connectors initiate --integration-type googlecalendar

# Initialize Google Calendar with specific scopes
npx base44 connectors initiate --integration-type googlecalendar --scopes https://www.googleapis.com/auth/calendar

# Initialize Gmail with comma-separated scopes
npx base44 connectors initiate --integration-type gmail --scopes scope.a,scope.b

# Initialize against a specific app without a local project
npx base44 connectors initiate --app-id app_123 --integration-type slack
```

## JSON Output

Under `--json`, the command emits a machine-readable result and does not open a browser or poll. The caller is responsible for opening `redirectUrl` to complete authorization:

```json
{
  "integrationType": "googlecalendar",
  "alreadyAuthorized": false,
  "redirectUrl": "https://auth.base44.io/oauth/...",
  "connectionId": "conn_abc123"
}
```

## Notes

- Use `connectors initiate` when you need to authorize a single connector outside of the full `connectors push` flow
- After authorization completes, run `npx base44 connectors pull` to fetch the connector config to local files
- Scopes can be passed space-separated (`--scopes a b c`) or comma-joined (`--scopes a,b,c`) or mixed

## Related Commands

- [connectors-create.md](connectors-create.md) - How to create connector config files
- [connectors-push.md](connectors-push.md) - Push all local connectors and authorize in one step
- [connectors-pull.md](connectors-pull.md) - Pull connector configs to local files
