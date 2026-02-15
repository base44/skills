# base44 connectors push

Push local connector configurations to Base44. Connectors are OAuth integrations that allow your Base44 app to connect with external services.

## Syntax

```bash
npx base44 connectors push
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Reads all connector files from the project's connectors directory
2. Validates connector configurations
3. Displays the count of connectors to be pushed
4. Uploads connectors to Base44
5. For connectors requiring OAuth authorization:
   - Opens browser windows for OAuth authorization flow
   - Polls for authorization completion
   - Reports authorization status for each connector
6. Reports the results: synced, added, removed, skipped, and failed connectors

## Prerequisites

- Must be run from a Base44 project directory
- Project must be linked to a Base44 app
- Connector definitions should be in the project's connectors directory (default: `base44/connectors/`)

## Output

```bash
$ npx base44 connectors push

Found 2 connectors to push: github, slack

Pushing connectors to Base44...

2 connector(s) require authorization in your browser:
  github: https://auth.base44.app/...
  slack: https://auth.base44.app/...

Open browser to authorize now? yes

Opening browser for github...
Waiting for github authorization... (Esc to skip)
✓ github authorization complete

Opening browser for slack...
Waiting for slack authorization... (Esc to skip)
✓ slack authorization complete

Summary:
Synced: existing_connector
Added: github, slack

✓ Connectors pushed to Base44
```

## Connector Synchronization

The push operation synchronizes your local connectors with Base44:

- **Synced**: Existing connectors that were updated successfully
- **Added**: New connectors that didn't exist in Base44 (after OAuth authorization)
- **Removed**: Connectors that were deleted from your local configuration
- **Skipped**: Connectors where OAuth authorization was skipped or cancelled
- **Failed**: Connectors that encountered errors during push or authorization

## OAuth Authorization Flow

Connectors requiring OAuth authorization trigger an interactive browser flow:

1. The CLI displays authorization URLs for each connector
2. You're prompted to confirm opening the browser
3. For each connector:
   - Browser opens to the OAuth authorization page
   - You authorize the connection in the browser
   - CLI polls for authorization completion (2 minute timeout)
   - Press Esc to skip the current connector

**Skipping authorization:**
- Press Esc during the "Waiting for authorization" step to skip the current connector
- Skipped connectors remain in "needs authorization" state
- Re-run `base44 connectors push` to authorize skipped connectors

**CI/CD environments:**
- OAuth prompts are automatically skipped when `CI` environment variable is set
- Authorization links are displayed for manual authorization
- Run the command locally or open the displayed links to complete authorization

## Error Handling

If no connectors are found in your project:
```bash
$ npx base44 connectors push
No local connectors found - checking for remote connectors to remove
```

If OAuth authorization times out:
```bash
Summary:
Failed: github - authorization timed out
```

If OAuth authorization fails:
```bash
Summary:
Failed: slack - authorization failed
```

## Use Cases

- After defining new connectors in your project
- When modifying existing connector configurations
- To authorize connectors after skipping OAuth flow
- As part of your development workflow when integrations change
- Initial setup of external service integrations

## Notes

- This command syncs connector configurations and handles OAuth authorization
- Changes are applied to your Base44 project immediately
- Connectors that fail authorization can be retried by running the command again
- The CLI opens browser windows for OAuth - ensure you have a browser available
- Connector definitions are stored in the connectors directory (configurable via `connectorsDir` in `config.jsonc`)
- Use `base44 connectors pull` to download connector configurations from Base44
- Authorization state is managed by Base44 - the CLI only facilitates the OAuth flow

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 connectors pull` | Pull connectors from Base44 to local files |
| `base44 deploy` | Deploy all project resources including connectors |
