# Function Logs API Reference

Runtime logs from Deno Deploy containing console output, errors, and stack traces.

## Endpoint

```
GET /api/apps/{app_id}/functions-mgmt/{function_name}/logs
Authorization: Bearer {token}
```

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `since` | ISO datetime | Show logs from this time (default: `2021-08-01T00:00:00Z`) |
| `until` | ISO datetime | Show logs until this time |

## Response

Array of log entries from Deno Deploy:

```json
[
  {
    "time": "2024-01-15T10:30:00.000Z",
    "level": "log",
    "message": "Processing request for user 123"
  },
  {
    "time": "2024-01-15T10:30:00.050Z",
    "level": "error",
    "message": "TypeError: Cannot read property 'id' of undefined\n    at handler (file:///src/index.ts:25:15)"
  }
]
```

## Log Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| `time` | ISO datetime | When the log was emitted |
| `level` | string | Log level: `log`, `info`, `warn`, `error`, `debug` |
| `message` | string | The log message (includes stack traces for errors) |

## Log Levels

| Level | Source |
|-------|--------|
| `log` | `console.log()` |
| `info` | `console.info()` |
| `warn` | `console.warn()` |
| `error` | `console.error()` or uncaught exceptions |
| `debug` | `console.debug()` |

## Limits

- **Max message size**: 2KB (larger messages are trimmed)
- **Rate limit**: Up to 1000 log entries per second per deployment
- **Retention**: Based on Deno Deploy subscription plan

## Script Usage

```bash
# All logs
./scripts/fetch-function-logs.sh <app_id> <function_name>

# Logs from specific time
./scripts/fetch-function-logs.sh <app_id> <function_name> --since 2024-01-01T00:00:00Z

# Logs in time range
./scripts/fetch-function-logs.sh <app_id> <function_name> --since 2024-01-01T00:00:00Z --until 2024-01-02T00:00:00Z
```

## Filtering Errors

To show only errors:

```bash
./scripts/fetch-function-logs.sh <app_id> <function_name> | jq '[.[] | select(.level == "error")]'
```
