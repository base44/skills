# Audit Logs API Reference

## Endpoint

```
POST /api/workspace/audit-logs/list?workspaceId={workspace_id}
Authorization: Bearer {token}
Content-Type: application/json
```

## Request

| Field | Type | Description |
|-------|------|-------------|
| `app_id` | string | Filter by app |
| `event_types` | string[] | Filter by event types |
| `user_email` | string | Filter by user |
| `status` | `success` \| `failure` | Filter by outcome |
| `start_date` | ISO datetime | From date |
| `end_date` | ISO datetime | To date |
| `limit` | 1-1000 | Results per page (default 50) |
| `order` | `ASC` \| `DESC` | Sort order (default DESC) |
| `cursor_timestamp` | ISO datetime | Pagination cursor |
| `cursor_user_email` | string | Pagination cursor |

## Response

```json
{
  "events": [{
    "timestamp": "ISO datetime",
    "user_email": "string",
    "workspace_id": "string",
    "app_id": "string",
    "ip": "string",
    "user_agent": "string",
    "event_type": "string",
    "status": "success | failure",
    "error_code": "string",
    "metadata": {}
  }],
  "pagination": {
    "total": 0,
    "limit": 50,
    "has_more": false,
    "next_cursor": null
  }
}
```

## Event Types & Metadata

### Runtime Events

| Event Type | Metadata |
|------------|----------|
| `api.function.call` | `function_name`, `status_code` |
| `app.entity.created` | `entity_name`, `entity_id` |
| `app.entity.updated` | `entity_name`, `entity_id` |
| `app.entity.deleted` | `entity_name`, `entity_id` |
| `app.entity.bulk_created` | `entity_name`, `method`, `count` |
| `app.entity.bulk_deleted` | `entity_name`, `method`, `count` |
| `app.entity.query` | `entity_name`, `filter_fields` |
| `app.user.registered` | `target_email`, `role` |
| `app.user.updated` | `target_user_id`, `target_email` |
| `app.user.deleted` | `target_user_id`, `target_email` |
| `app.user.role_changed` | `target_email`, `old_role`, `new_role` |
| `app.user.invited` | `invitee_email`, `role` |
| `app.user.page_visit` | `page_name`, `origin_url` |
| `app.auth.login` | `auth_method`, `sso_provider` |
| `app.access.requested` | `requester_email` |
| `app.access.approved` | `target_email` |
| `app.access.denied` | `target_email` |
| `app.integration.executed` | `integration_name`, `action`, `duration_ms` |
| `app.automation.executed` | `automation_id`, `automation_name`, `automation_type` |
| `app.agent.conversation` | `agent_name`, `conversation_id`, `model` |

### Setup Events

| Event Type | Metadata |
|------------|----------|
| `app.created` | `app_name` |
| `app.deleted` | `app_name` |
| `app.published` | `checkpoint_id` |
| `app.schema.created` | `entity_name`, `has_rls` |
| `app.schema.updated` | `entity_name`, `rls_changed`, `has_rls` |
| `app.schema.deleted` | `entity_name` |
| `integration.stripe.*` | `sandbox_id` |
| `integration.oauth.*` | `integration_type` |
| `domain.*` | `domain`, `domain_id` |

## Function Logs Endpoint

```
GET /api/apps/{app_id}/functions-mgmt/{function_name}/logs?since={ISO datetime}
Authorization: Bearer {token}
```

Returns Deno Deploy runtime logs (console output, errors, stack traces).
