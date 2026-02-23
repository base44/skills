# base44 logs

Fetch function logs for this app. Retrieves log entries from one or more backend functions, with optional filtering by time range, log level, and result count.

## Syntax

```bash
npx base44 logs [options]
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--function <names>` | Filter by function name(s), comma-separated. If omitted, fetches logs for all project functions | No |
| `--since <datetime>` | Show logs from this time (ISO 8601 format) | No |
| `--until <datetime>` | Show logs until this time (ISO 8601 format) | No |
| `--level <level>` | Filter by log level (`info`, `warning`, `error`, `debug`) | No |
| `-n, --limit <n>` | Number of results (1–1000, default: 50) | No |
| `--order <order>` | Sort order: `asc` or `desc` (default: `desc`) | No |

## Prerequisites

- Must be run from a Base44 project directory
- Project must be linked to a Base44 app
- Target functions must have been deployed before logs are available

## Examples

```bash
# Fetch logs for all functions in the project (last 50 entries)
npx base44 logs

# Fetch logs for a specific function
npx base44 logs --function send_email

# Fetch logs for multiple functions
npx base44 logs --function send_email,process_payment

# Filter by time range
npx base44 logs --since 2024-01-15T10:00:00Z --until 2024-01-15T11:00:00Z

# Filter by log level
npx base44 logs --level error

# Fetch more results in ascending order
npx base44 logs -n 200 --order asc
```

## Output

```
Showing 3 function log entries

2024-01-15 10:05:32 INFO  [send_email] Sending email to user@example.com
2024-01-15 10:05:33 INFO  [send_email] Email sent successfully
2024-01-15 10:07:44 ERROR [process_payment] Payment gateway timeout
```

When no logs match the filters:
```
No logs found matching the filters.
```

When no functions are found in the project:
```
No functions found in this project.
```

## Notes

- When `--function` is omitted, logs from **all** project functions are fetched and merged by timestamp
- Datetime values without a timezone suffix are treated as UTC (a `Z` suffix is added automatically)
- When fetching multiple functions, results are merged and sorted by timestamp according to `--order`
- The `--limit` applies to the total number of entries across all functions
- This command is currently hidden from the default help output but is fully functional
