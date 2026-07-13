# base44 logs

Fetch function logs for this app.

## Syntax

```bash
npx base44 logs [options]
```

This command can run from a linked project, or outside a project when you pass `--app-id <id>` or set `BASE44_APP_ID`.

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--function <names>` | Filter by function name(s), comma-separated. If omitted, fetches logs for all functions in the current app | No |
| `--since <datetime>` | Show logs from this time. ISO datetime or relative shorthand (e.g. `1h`, `30m`, `2d`) | No |
| `--until <datetime>` | Show logs until this time. ISO datetime or relative shorthand (e.g. `1h`, `30m`, `2d`). Cannot be combined with `--follow` | No |
| `--level <level>` | Filter by log level: `info`, `warning`, `error`, `debug` | No |
| `-n, --limit <n>` | Number of results to return (1-1000, default: 50) | No |
| `--order <order>` | Sort order: `asc` or `desc` (default: `desc`). Cannot be combined with `--follow` | No |
| `--env <env>` | Which deployment to read logs from: `preview` (current draft) or `prod` (published). Default: `preview` | No |
| `-f, --follow` | Stream new logs as they arrive instead of a one-shot fetch | No |

## Examples

```bash
# Fetch logs for all project functions (last 50 entries)
npx base44 logs

# Fetch logs for a specific app without a local checkout
npx base44 logs --app-id app_123

# Fetch only errors
npx base44 logs --level error

# Fetch logs for a specific function
npx base44 logs --function my-function

# Fetch logs for multiple functions
npx base44 logs --function send-email,process-payment

# Fetch logs since a specific time (ISO datetime)
npx base44 logs --since 2024-01-15T10:00:00

# Fetch logs from the last hour (relative shorthand)
npx base44 logs --since 1h

# Fetch logs within a time range
npx base44 logs --since 2024-01-15T10:00:00 --until 2024-01-15T12:00:00

# Fetch last 100 log entries in ascending order
npx base44 logs -n 100 --order asc

# Last 10 errors for a specific function
npx base44 logs --function myFunction --level error --limit 10

# Fetch logs from the published (prod) deployment instead of preview
npx base44 logs --env prod

# Stream new logs live as they arrive
npx base44 logs --follow
```

## Notes

- **Authentication required.** You must be logged in before fetching logs.
- **App context required.** Run from a linked project, or pass `--app-id` / set `BASE44_APP_ID`.
- When multiple functions are specified, logs are merged and sorted by timestamp.
- If `--function` is omitted, logs are fetched for **all functions** in the current app.
- The `--limit` applies after merging logs from all specified functions.
- The `--since` and `--until` values accept an ISO datetime, or a relative shorthand (e.g. `1h`, `30m`, `2d`) measured back from now. ISO values without a timezone are normalized to UTC (appends `Z`).
- `--env` defaults to `preview`. If `prod` returns no logs, the app may not have been published yet — try `--env preview` to see draft logs.
- `--level` is enforced client-side as well as server-side, so filtering is reliable even for runtimes (e.g. per-app Cloudflare deployments) where the backend returns the unfiltered stream.
- `--follow` streams logs indefinitely (oldest to newest) instead of a single fetch; it's incompatible with `--until` and `--order`.
- Pass the global `--json` flag to emit each log entry (or, with `--follow`, each new line) as JSON instead of the human-readable format.
