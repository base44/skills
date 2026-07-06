# base44 connectors initiate

Initialize a connector on an app and start its OAuth flow. Unlike `connectors push`, this works **projectless** — it only needs an app id, not a local project directory.

## Syntax

```bash
npx base44 connectors initiate --integration-type <type> [--scopes <scopes...>] [--app-id <id>]
```

## Options

| Option | Description | Required |
|--------|--------------|----------|
| `--integration-type <type>` | Integration type to initiate (e.g. `googlecalendar`, `gmail`, `slack`) | Yes |
| `--scopes <scopes...>` | OAuth scopes to request. Space- or comma-separated | No |
| `--app-id <id>` | App to initiate the connector on. Falls back to `BASE44_APP_ID` or a linked local project | No |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Starts (or re-scopes) the OAuth connection for the given integration type on the target app
2. If already authorized with the requested scopes, reports that immediately
3. Otherwise prints an authorization URL and, when interactive, opens it in a browser and polls until authorization completes
4. Once authorized, run `base44 connectors pull` to fetch the connector's config to local files

## Output

```bash
$ npx base44 connectors initiate --app-id app_123 --integration-type googlecalendar --scopes https://www.googleapis.com/auth/calendar

Authorize googlecalendar here: https://auth.base44.io/oauth/...

✓ googlecalendar authorized. Run 'base44 connectors pull' to fetch its config.
```

When already authorized:
```bash
$ npx base44 connectors initiate --app-id app_123 --integration-type slack

✓ slack is already authorized. Run 'base44 connectors pull' to fetch its config.
```

## Declarative Scopes

Scopes passed to `initiate` **replace** the connector's existing scopes rather than merging with them — omitted scopes are dropped and the user is re-prompted to consent. Run `connectors list-available` (or `connectors pull`) first to see current scopes, then pass the full desired set (existing scopes you want to keep plus any new ones).

## JSON Output

Pass the global `--json` flag for a machine-readable result. In this mode the CLI never opens a browser or polls — it just returns the `redirectUrl` for the caller to handle:

```bash
$ npx base44 connectors initiate --app-id app_123 --integration-type gmail --scopes scope.a,scope.b --json
{
  "integrationType": "gmail",
  "alreadyAuthorized": false,
  "redirectUrl": "https://auth.base44.io/oauth/...",
  "connectionId": "conn_123"
}
```

## Error Handling

If a different user already authorized this connector:
```bash
Error: Could not initiate googlecalendar: different_user (already authorized by other.user@example.com)
```

If `--integration-type` is missing or invalid:
```bash
Error: A valid --integration-type is required (e.g. googlecalendar, gmail, slack).
```

## Use Cases

- Set up a connector on an app without a local project checkout (e.g. from an agent or CI)
- Re-scope an existing connector's OAuth permissions
- Kick off authorization as a discrete step before `connectors pull`

## Related Commands

- [connectors-list-available.md](connectors-list-available.md) - List all available integration types
- [connectors-pull.md](connectors-pull.md) - Pull connectors from Base44 to local files
- [connectors-push.md](connectors-push.md) - Push local connectors to Base44 (project-based full sync)
- [connectors-create.md](connectors-create.md) - How to create connector configuration files
