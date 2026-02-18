# Agent Conversations API

Fetch AI agent conversation history including all messages and tool call results.

## Authentication Flow

Agent conversations use **app user tokens**, not platform tokens. The script handles this automatically:

1. Platform token → `GET /api/apps/{app_id}/auth/token` → App user token
2. App user token → `GET /api/apps/{app_id}/agents/conversations`

## Endpoints

### List Conversations

```
GET /api/apps/{app_id}/agents/conversations
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_name` | string | Filter by agent name |
| `limit` | number | Max results (default: 50) |
| `skip` | number | Pagination offset |

### Get Single Conversation

```
GET /api/apps/{app_id}/agents/conversations/{conversation_id}
```

## Response Schema

### AgentConversation

```json
{
  "id": "conversation_id_123",
  "app_id": "app_id_456",
  "created_by_id": "user_id_789",
  "agent_name": "task_agent",
  "metadata": {},
  "messages": [Message, ...]
}
```

### Message

```json
{
  "id": "msg_uuid",
  "role": "user" | "assistant" | "system",
  "content": "message text or null for tool calls",
  "tool_calls": [ToolCall, ...] | null,
  "reasoning": { ... } | null,
  "metadata": {
    "created_date": "2024-01-15T10:30:00Z",
    "created_by_email": "user@example.com"
  }
}
```

### ToolCall

```json
{
  "id": "call_uuid",
  "name": "read_task",
  "arguments_string": "{\"query\":{\"title\":\"test\"}}",
  "status": "success" | "error" | "running" | "stopped" | "waiting_for_user_input",
  "results": "result string or error message"
}
```

## Tool Call Status Values

| Status | Description |
|--------|-------------|
| `success` | Tool executed successfully |
| `error` | Tool failed (check `results` for error message) |
| `running` | Tool currently executing |
| `stopped` | Execution was stopped |
| `waiting_for_user_input` | Awaiting user approval |

## Common Tool Error Patterns

### RLS Denial (Entity Not Found)
```json
{
  "name": "delete_task",
  "status": "error",
  "results": "Error deleting Task: status=404 message=Entity Task with ID abc123 not found"
}
```
This typically indicates RLS blocked the operation - the entity exists but the user doesn't have permission.

### Validation Error
```json
{
  "name": "create_task",
  "status": "error", 
  "results": "Error creating Task: status=422 message=Validation error: title is required"
}
```

## Filtering for Errors

Use jq to find conversations with failed tool calls:

```bash
# Get conversations with errors
jq '[.[] | select(.messages[]?.tool_calls[]?.status == "error")]'

# Extract just error details
jq '.messages[].tool_calls[]? | select(.status == "error") | {name, status, results}'
```
