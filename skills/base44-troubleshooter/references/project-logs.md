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
| `--until <datetime>` | Show logs until this time. ISO datetime or relative shorthand (e.g. `1h`, `30m`, `2d`) | No |
| `--level <level>` | Filter by log level: `log`, `info`, `warn`, `error`, `debug` | No |
| `-n, --limit <n>` | Number of results to return (1-1000, default: 50) | No |
| `--order <order>` | Sort order: `asc` or `desc` (default: `desc`) | No |
| `--env <env>` | Which deployment to read logs from: `preview` (current draft) or `prod` (published). Default: `preview` | No |

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

# Fetch logs using relative time shorthand
npx base44 logs --since 1h
npx base44 logs --since 30m --until 10m

# Fetch logs within a time range
npx base44 logs --since 2024-01-15T10:00:00 --until 2024-01-15T12:00:00

# Fetch last 100 log entries in ascending order
npx base44 logs -n 100 --order asc

# Last 10 errors for a specific function
npx base44 logs --function myFunction --level error --limit 10

# Fetch production logs (published app)
npx base44 logs --env prod

# Fetch preview logs (current draft, default)
npx base44 logs --env preview
```

## Notes

- **Authentication required.** You must be logged in before fetching logs.
- **App context required.** Run from a linked project, or pass `--app-id` / set `BASE44_APP_ID`.
- When multiple functions are specified, logs are merged and sorted by timestamp.
- If `--function` is omitted, logs are fetched for **all functions** in the current app.
- The `--limit` applies after merging logs from all specified functions.
- The `--since` and `--until` values accept ISO datetimes or relative shorthands like `1h`, `30m`, `2d`. ISO values without a timezone are normalized to UTC (appends `Z`).
- `--env preview` shows logs from the current draft (default); `--env prod` shows logs from the published version.
