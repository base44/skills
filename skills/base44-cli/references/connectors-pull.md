# base44 connectors pull

Pull connector configurations from Base44 to local files. Replaces all local connector configs with the remote versions.

## Syntax

```bash
npx base44 connectors pull [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--dir <path>` | Directory to write connector files to (default: `./connectors` when using `--app-id`) | No |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Fetches all connectors from Base44
2. Writes connector files to the project's connectors directory
3. Deletes local connector files that don't exist remotely
4. Reports written and deleted connectors

## App Context

Works in two modes:
- **Linked project** (default): reads the connectors directory from `base44/config.jsonc`
- **App ID mode** (`--app-id` or `BASE44_APP_ID`): no local project required; writes to `./connectors` by default (override with `--dir`)

## Output

```bash
$ npx base44 connectors pull

Fetching connectors from Base44...
✓ Connectors fetched successfully

Syncing connector files...
✓ Connector files synced successfully

Written: googlecalendar, slack
Deleted: notion

Pulled 2 connectors to base44/connectors
```

## Connector Synchronization

The pull operation synchronizes remote connectors to your local files:

- **Written**: Connector files created or updated from remote
- **Deleted**: Local connector files removed (didn't exist remotely)
- **Up to date**: If no changes needed, reports "All connectors are already up to date"

**Warning**: This operation replaces all local connector configurations with remote versions. Any local changes not pushed to Base44 will be overwritten.

## Error Handling

If no connectors exist on Base44:
```bash
$ npx base44 connectors pull
All connectors are already up to date
```

## Use Cases

- Sync connector configurations to a new development machine
- Get the latest connector configurations from your team
- Restore local connector files after accidental deletion
- Start working on an existing project with connectors

## Notes

- Connector files are stored as `.jsonc` in the connectors directory
- When using a linked project, the directory location is configurable via `connectorsDir` in `config.jsonc`
- Use `base44 connectors push` to upload local changes to Base44

## Related Commands

- [connectors-create.md](connectors-create.md) - How to create connector configuration files
- [connectors-push.md](connectors-push.md) - Push local connectors to Base44
