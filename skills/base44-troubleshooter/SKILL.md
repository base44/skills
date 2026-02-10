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

If not authenticated or token expired, instruct user to run `base44 login`.

## Fetching Function Logs

Must be run from the project directory (where `base44/.app.jsonc` exists).

```bash
npx base44 logs [options]
```

**Options**:
| Option | Description |
|--------|-------------|
| `--function <names>` | Filter by function name(s), comma-separated. If omitted, fetches logs for all project functions |
| `--since <datetime>` | Show logs from this time (ISO format) |
| `--until <datetime>` | Show logs until this time (ISO format) |
| `--level <level>` | Filter by log level: `log`, `info`, `warn`, `error`, `debug` |
| `-n, --limit <n>` | Results per page (1-1000, default: 50) |
| `--order <order>` | Sort order: `ASC` \| `DESC` (default: DESC) |
| `--json` | Output raw JSON |

**Examples**:

```bash
# All recent logs
npx base44 logs

# Errors only
npx base44 logs --level error

# Specific function
npx base44 logs --function myFunction

# Multiple functions
npx base44 logs --function createOrder,processPayment

# Time range
npx base44 logs --since 2024-01-01T00:00:00Z --until 2024-01-02T00:00:00Z

# Last 10 errors for a specific function
npx base44 logs --function myFunction --level error --limit 10
```

## Troubleshooting Flow

### 1. Confirm Project Context

Make sure you're in a Base44 project directory:

```bash
cat base44/.app.jsonc
```

### 2. Check Recent Errors

```bash
npx base44 logs --level error
```

### 3. Drill Into a Specific Function

If you know which function is failing:

```bash
npx base44 logs --function <function_name> --level error
```

### 4. Analyze the Logs

- Look for stack traces and error messages in the output
- Check timestamps to correlate with user-reported issues
- Use `--json` for structured output when you need to parse details
