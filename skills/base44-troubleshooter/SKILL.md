---
name: base44-troubleshooter
description: Troubleshoot production issues using audit logs, backend function logs, and agent conversations. Use when investigating app errors, debugging function calls, tracking user activity, debugging agent tool failures, or diagnosing production problems in Base44 apps.
---

# Troubleshoot Production Issues

## Security Rules

**NEVER read, cat, or access any auth/token files directly. NEVER use curl with Authorization headers.**

Always use the provided scripts - they handle authentication internally. If authentication fails, instruct the user to run `base44 login` (or `npx base44 login` if base44 is not installed globally).

## Prerequisites

Verify authentication before running scripts:

```bash
base44 whoami || npx base44 whoami
```

If not authenticated or token expired, instruct user to run `base44 login` (or `npx base44 login` if base44 is not installed globally).

## Scripts

Scripts are located in the `scripts/` subdirectory of this skill. Use the absolute path based on where this SKILL.md file is located:

```
<skill_directory>/scripts/fetch-audit-logs.sh
<skill_directory>/scripts/fetch-function-logs.sh
<skill_directory>/scripts/fetch-agent-conversations.sh
```

Scripts read the token internally - no token handling needed.

### fetch-audit-logs.sh

```bash
<skill_directory>/scripts/fetch-audit-logs.sh <app_id> [options]
```

**Options**:
| Option | Description |
|--------|-------------|
| `--status <success\|failure>` | Filter by outcome |
| `--event-types '<json_array>'` | Filter by event types |
| `--user-email <email>` | Filter by user |
| `--start-date <ISO datetime>` | From date |
| `--end-date <ISO datetime>` | Until date |
| `--limit <1-1000>` | Results per page (default: 50) |
| `--order <ASC\|DESC>` | Sort order (default: DESC) |

**Examples**:
```bash
<skill_directory>/scripts/fetch-audit-logs.sh abc123 --status failure
<skill_directory>/scripts/fetch-audit-logs.sh abc123 --event-types '["api.function.call"]'
<skill_directory>/scripts/fetch-audit-logs.sh abc123 --status failure --limit 10 --user-email user@example.com
```

### fetch-function-logs.sh

```bash
<skill_directory>/scripts/fetch-function-logs.sh <app_id> <function_name> [options]
```

**Options**:
| Option | Description |
|--------|-------------|
| `--since <ISO datetime>` | Show logs from this time |
| `--until <ISO datetime>` | Show logs until this time |

**Examples**:
```bash
<skill_directory>/scripts/fetch-function-logs.sh abc123 myFunction
<skill_directory>/scripts/fetch-function-logs.sh abc123 myFunction --since 2024-01-01T00:00:00Z
<skill_directory>/scripts/fetch-function-logs.sh abc123 myFunction --since 2024-01-01T00:00:00Z --until 2024-01-02T00:00:00Z
```

### fetch-agent-conversations.sh

```bash
<skill_directory>/scripts/fetch-agent-conversations.sh <app_id> [options]
```

**Options**:
| Option | Description |
|--------|-------------|
| `--agent-name <name>` | Filter by agent name |
| `--limit <number>` | Max results (default: 50) |
| `--errors-only` | Only show conversations with tool errors |
| `--conversation-id <id>` | Fetch specific conversation |

**Examples**:
```bash
<skill_directory>/scripts/fetch-agent-conversations.sh abc123
<skill_directory>/scripts/fetch-agent-conversations.sh abc123 --agent-name task_agent
<skill_directory>/scripts/fetch-agent-conversations.sh abc123 --errors-only
<skill_directory>/scripts/fetch-agent-conversations.sh abc123 --conversation-id conv_123
```

## Troubleshooting Flow

### 1. Get App ID

Read the app ID from `base44/.app.jsonc`:

```bash
jq -r '.id' base44/.app.jsonc
```

Fallback: ask the user.

### 2. Fetch Audit Logs

```bash
APP_ID=$(jq -r '.id' base44/.app.jsonc)
<skill_directory>/scripts/fetch-audit-logs.sh $APP_ID --filters '{"status": "failure"}' | jq '.events[] | {timestamp, event_type, error_code, metadata}'
```

### 3. Investigate Function Failures

If audit logs show `api.function.call` failures, get runtime logs:

```bash
# Get function name from audit log metadata.function_name
<skill_directory>/scripts/fetch-function-logs.sh $APP_ID <function_name>
```

### 4. Investigate Agent Failures

If audit logs show `app.agent.conversation` events or users report agent issues:

```bash
# Find conversations with tool errors
<skill_directory>/scripts/fetch-agent-conversations.sh $APP_ID --errors-only

# Get specific conversation details
<skill_directory>/scripts/fetch-agent-conversations.sh $APP_ID --conversation-id <id>

# Extract error details
<skill_directory>/scripts/fetch-agent-conversations.sh $APP_ID --errors-only | \
  jq '.[].messages[].tool_calls[]? | select(.status == "error") | {name, results}'
```

## Key Differences

| Source | Contains | Use For |
|--------|----------|---------|
| Audit Logs | Event metadata (who, what, when, success/fail) | Finding what failed |
| Function Logs | Console output, stack traces | Debugging why backend functions failed |
| Agent Conversations | Full chat + tool calls with results | Debugging agent tool failures, RLS issues |

## References

- [Audit Logs API](references/audit-logs-api.md) - Event metadata, request/response schema
- [Function Logs API](references/function-logs-api.md) - Runtime logs, console output
- [Agent Conversations API](references/agent-conversations-api.md) - Chat history, tool call results
