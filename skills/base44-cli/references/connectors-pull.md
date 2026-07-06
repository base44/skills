# base44 connectors pull

Pull connector configurations from Base44 to local files. Replaces all local connector configs with the remote versions.

## Syntax

```bash
npx base44 connectors pull [--dir <path>]
```

## Options

| Option | Description | Required |
|--------|--------------|----------|
| `--dir <path>` | Directory to write connector files to. Only used with `--app-id` (no local project); defaults to `./connectors` | No |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Fetches all connectors from Base44
2. Writes connector files to the `base44/connectors/` directory (or `--dir`/`./connectors` when run with `--app-id` and no local project)
3. Deletes local connector files that don't exist remotely
4. Reports written and deleted connectors

## Prerequisites

- Either run from a Base44 project directory linked to an app, or pass `--app-id`/`BASE44_APP_ID` (projectless mode)

## Projectless Mode

`connectors pull` can run without a local project by passing `--app-id` (or setting `BASE44_APP_ID`). In that mode there's no `config.jsonc` to read `connectorsDir` from, so files are written to `./connectors` by default — override with `--dir`:

```bash
npx base44 connectors pull --app-id app_123 --dir ./my-connectors
```

## JSON Output

Pass the global `--json` flag to get a machine-readable result instead of human-oriented log lines:

```bash
npx base44 connectors pull --json
```

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

- Connector files are stored as `.jsonc` in the `base44/connectors/` directory
- The directory location is configurable via `connectorsDir` in `config.jsonc`
- Use `base44 connectors push` to upload local changes to Base44

## Related Commands

- [connectors-create.md](connectors-create.md) - How to create connector configuration files
- [connectors-push.md](connectors-push.md) - Push local connectors to Base44
