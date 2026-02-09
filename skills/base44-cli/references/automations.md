# Function Automations

Automations are triggers attached to backend functions. They cause a function to run automatically on a schedule (CRON, simple interval, or one-time) or when entity data changes (create, update, delete). Automations are defined in the `automations` array inside each function's `function.jsonc` and are deployed together with the function via `npx base44 functions deploy`.

## Overview

- **Where**: `base44/functions/<function-name>/function.jsonc` — optional `automations` array
- **Deploy**: Automations are deployed with the function; no separate command
- **Types**: Scheduled (one-time, CRON, simple interval) and entity hooks

## Common Fields (All Automation Types)

Every automation shares these base fields:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Display name for the automation (min 1 char) |
| `description` | string \| null | No | Optional description |
| `function_args` | object \| null | No | Key-value args passed to the function when it runs |
| `is_active` | boolean | No | Whether the automation is active (default: `true`) |

## Automation Types

### 1. Scheduled One-Time

Runs the function once at a specific date/time.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"scheduled"` | Yes | Must be `"scheduled"` |
| `schedule_mode` | `"one-time"` | Yes | One-time execution |
| `one_time_date` | string | Yes | ISO date/time when the function should run |

**Example:**

```jsonc
{
  "name": "my-function",
  "entry": "index.ts",
  "automations": [
    {
      "name": "Launch reminder",
      "type": "scheduled",
      "schedule_mode": "one-time",
      "one_time_date": "2026-03-01T09:00:00.000Z",
      "description": "One-time reminder on launch day"
    }
  ]
}
```

### 2. Scheduled CRON (Recurring)

Runs the function on a cron schedule (e.g. daily at 9am, every Monday).

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"scheduled"` | Yes | Must be `"scheduled"` |
| `schedule_mode` | `"recurring"` | Yes | Recurring execution |
| `schedule_type` | `"cron"` | Yes | Use cron expression |
| `cron_expression` | string | Yes | Standard cron expression (e.g. `0 9 * * *` = 9am daily) |
| `ends_type` | `"never"` \| `"on"` \| `"after"` | No | When the schedule stops (default: `"never"`) |
| `ends_on_date` | string \| null | No | When `ends_type` is `"on"`, ISO date to stop |
| `ends_after_count` | number \| null | No | When `ends_type` is `"after"`, number of runs then stop |

**Cron format:** `minute hour day-of-month month day-of-week` (e.g. `0 9 * * *` = 9:00 UTC daily).

**Example:**

```jsonc
{
  "name": "daily-report",
  "entry": "index.ts",
  "automations": [
    {
      "name": "Daily Report",
      "type": "scheduled",
      "schedule_mode": "recurring",
      "schedule_type": "cron",
      "cron_expression": "0 9 * * *",
      "description": "Run every day at 9:00 UTC",
      "is_active": true
    }
  ]
}
```

### 3. Scheduled Simple (Recurring Interval)

Runs the function on a simple repeat (every N minutes/hours/days/weeks/months).

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"scheduled"` | Yes | Must be `"scheduled"` |
| `schedule_mode` | `"recurring"` | Yes | Recurring execution |
| `schedule_type` | `"simple"` | Yes | Use simple interval |
| `repeat_unit` | `"minutes"` \| `"hours"` \| `"days"` \| `"weeks"` \| `"months"` | Yes | Unit of repetition |
| `repeat_interval` | number | No | Positive integer; interval within the unit (default 1) |
| `start_time` | string \| null | No | Time of day to run (e.g. `"09:00"`) |
| `repeat_on_days` | number[] \| null | No | For weeks: 0–6 (0 = Sunday, 6 = Saturday) |
| `repeat_on_day_of_month` | number \| null | No | For months: 1–31 |
| `ends_type` | `"never"` \| `"on"` \| `"after"` | No | When the schedule stops (default: `"never"`) |
| `ends_on_date` | string \| null | No | When `ends_type` is `"on"`, ISO date to stop |
| `ends_after_count` | number \| null | No | When `ends_type` is `"after"`, number of runs then stop |

**Example:**

```jsonc
{
  "name": "weekly-cleanup",
  "entry": "index.ts",
  "automations": [
    {
      "name": "Weekly Cleanup",
      "type": "scheduled",
      "schedule_mode": "recurring",
      "schedule_type": "simple",
      "repeat_unit": "weeks",
      "repeat_interval": 1,
      "repeat_on_days": [1],
      "start_time": "02:00",
      "description": "Every Monday at 2:00"
    }
  ]
}
```

### 4. Entity Hook

Runs the function when an entity record is created, updated, or deleted.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"entity"` | Yes | Must be `"entity"` |
| `entity_name` | string | Yes | Entity name (matches entity schema name, e.g. `Order`, `Task`) |
| `event_types` | `("create" \| "update" \| "delete")[]` | Yes | At least one; which events trigger the function |

**Example:**

```jsonc
{
  "name": "on-order-created",
  "entry": "index.ts",
  "automations": [
    {
      "name": "On Order Created",
      "type": "entity",
      "entity_name": "Order",
      "event_types": ["create"],
      "description": "Run when a new order is created"
    },
    {
      "name": "On Order Update or Delete",
      "type": "entity",
      "entity_name": "Order",
      "event_types": ["update", "delete"]
    }
  ]
}
```

**Note:** Entity names must match the entity schema `name` in `base44/entities/` (e.g. entity file `order.jsonc` with `"name": "Order"` → use `"entity_name": "Order"`).

## Full Examples

### Daily CRON report

**base44/functions/daily-report/function.jsonc:**

```jsonc
{
  "name": "daily-report",
  "entry": "index.ts",
  "automations": [
    {
      "name": "Daily Report",
      "type": "scheduled",
      "schedule_mode": "recurring",
      "schedule_type": "cron",
      "cron_expression": "0 9 * * *",
      "is_active": true
    }
  ]
}
```

**base44/functions/daily-report/index.ts:**

```typescript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  // Scheduled runs get auth context; use asServiceRole if you need full access
  const base44Admin = base44.asServiceRole;

  const orders = await base44Admin.entities.Orders.list({ limit: 100 });
  const summary = { total: orders.length, date: new Date().toISOString() };

  // e.g. send to Slack, email, or store in another entity
  return Response.json({ success: true, summary });
});
```

### Entity hook: on order created

**base44/functions/on-order-created/function.jsonc:**

```jsonc
{
  "name": "on-order-created",
  "entry": "index.ts",
  "automations": [
    {
      "name": "On Order Created",
      "type": "entity",
      "entity_name": "Order",
      "event_types": ["create"],
      "is_active": true
    }
  ]
}
```

**base44/functions/on-order-created/index.ts:**

```typescript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  // Request body contains entity hook payload (e.g. entity id, event type, changed data)
  const payload = await req.json();

  const { entity_id, event_type } = payload;
  const order = await base44.asServiceRole.entities.Orders.get(entity_id);

  // e.g. send confirmation email, update inventory
  return Response.json({ success: true, orderId: order?.id });
});
```

### Weekly cleanup (simple schedule)

**base44/functions/weekly-cleanup/function.jsonc:**

```jsonc
{
  "name": "weekly-cleanup",
  "entry": "index.ts",
  "automations": [
    {
      "name": "Weekly Cleanup",
      "type": "scheduled",
      "schedule_mode": "recurring",
      "schedule_type": "simple",
      "repeat_unit": "weeks",
      "repeat_interval": 1,
      "repeat_on_days": [1],
      "start_time": "02:00",
      "description": "Every Monday at 2:00"
    }
  ]
}
```

## Common Patterns

| Pattern | Use | Automation type |
|--------|-----|------------------|
| Daily report / digest | Email or Slack at 9am | CRON with `cron_expression`: `0 9 * * *` |
| On new record | Notify, sync, or validate when entity is created | Entity hook with `event_types`: `["create"]` |
| On update/delete | Audit, cache invalidation, or cleanup | Entity hook with `event_types`: `["update"]` or `["delete"]` |
| Weekly job | Cleanup or aggregation every Monday | Simple with `repeat_unit`: `"weeks"`, `repeat_on_days`: `[1]` |
| One-time run | Launch task or migration at a fixed time | One-time with `one_time_date` |

## Deploying

Automations are deployed with their function. There is no separate automation deploy command.

```bash
npx base44 functions deploy
```

This deploys all functions in `base44/functions/` and their `automations` arrays. For more on deployment, see [functions-deploy.md](functions-deploy.md).

## Common Mistakes

| Wrong | Correct | Why |
|-------|---------|-----|
| `entity_name: "order"` when schema name is `Order` | `entity_name: "Order"` | Entity name must match schema `name` exactly |
| `event_types: []` or missing | `event_types: ["create"]` (at least one) | At least one event type is required for entity hooks |
| `schedule_type: "cron"` without `cron_expression` | Always set `cron_expression` for cron | Cron schedules require a valid cron expression |
| Putting automations in a separate file | Put `automations` inside `function.jsonc` | Automations are part of the function config |
| Expecting a separate `base44 automations deploy` | Use `npx base44 functions deploy` | Automations deploy with the function |
