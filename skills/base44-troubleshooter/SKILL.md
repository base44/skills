---
name: base44-troubleshooter
description: Troubleshoot production issues using backend function logs. Use when investigating app errors, debugging function calls, or diagnosing production problems in Base44 apps.
---

# Troubleshoot Production Issues

## Prerequisites

Verify authentication before fetching logs:

```bash
npx base44 whoami
```

If not authenticated or token expired, instruct user to run `npx base44 login`.

Resolve app context in one of these ways:

```bash
# From a linked local project
cat base44/.app.jsonc

# Or explicitly
npx base44 logs --app-id app_123
```

## Available Commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 logs` | Fetch function logs for this app | [project-logs.md](references/project-logs.md) |

## Troubleshooting Flow

### 1. Check Recent Errors

Start by pulling the latest errors across all functions:

```bash
npx base44 logs --level error
```

### 2. Drill Into a Specific Function

If you know which function is failing:

```bash
npx base44 logs --function <function_name> --level error
```

If you are outside the project directory, pass the app explicitly:

```bash
npx base44 logs --app-id app_123 --function <function_name> --level error
```

### 3. Inspect a Time Range

Correlate with user-reported issue timestamps. Use relative shorthands (`1h`, `30m`, `2d`) or ISO datetimes:

```bash
# Last hour
npx base44 logs --function <function_name> --since 1h

# Specific range
npx base44 logs --function <function_name> --since <start_time> --until <end_time>
```

### 4. Analyze the Logs

- Look for stack traces and error messages in the output
- Check timestamps to correlate with user-reported issues
- Use `--limit` to fetch more entries if the default 50 isn't enough
