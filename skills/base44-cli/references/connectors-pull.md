# base44 connectors pull

Pull connector configurations from Base44 to local files. Replaces all local connector configs with the remote versions.

## Syntax

```bash
npx base44 connectors pull [options]
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--dir <path>` | Directory to write connector files to (default: `./connectors` when using `--app-id`) | No |

## What It Does

1. Fetches all connectors from Base44
2. Writes connector files to the connectors directory
3. Deletes local connector files that don't exist remotely
4. Reports written and deleted connectors

## Prerequisites

- Must be run from a linked Base44 project, OR pass `--app-id` / set `BASE44_APP_ID`
- When using `--app-id`, connector files are written to `./connectors/` by default (override with `--dir`)

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

- Connector files are stored as `.jsonc`
- For linked projects, the directory is `base44/connectors/` (configurable via `connectorsDir` in `config.jsonc`)
- For projectless use (`--app-id`), defaults to `./connectors/` (override with `--dir`)
- Use `base44 connectors push` to upload local changes to Base44

## Related Commands

- [connectors-create.md](connectors-create.md) - How to create connector configuration files
- [connectors-push.md](connectors-push.md) - Push local connectors to Base44
