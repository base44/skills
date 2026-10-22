<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 workflows: Workflows (TanStack Start: steps call server routes)

<workflows_capability>
Workflows: trigger-driven automated processes — one step (e.g. a scheduled function call) or complex (multi-step, `switch` branching, durable waits across hours/days, data threading, chained backend functions). For any "when X happens, do Y" / "every N hours/days, do Y", however many actions Y involves.

<files_and_runs>
Workflow files live at `base44/workflows/<Name>.jsonc`; writing the file creates or updates the workflow, deleting it removes the workflow. Status and runs: `base44 workflows list --app-id <APP_ID>` and `base44 workflows runs --app-id <APP_ID> [--status failed]`, or the Workflows dashboard.
</files_and_runs>

<workflow_building_blocks>
What workflows can be built from; the authoring guide that follows documents each in full.
## Workflow Building Blocks

### Triggers (what starts a workflow)
- scheduled — Fires on a schedule — a cron cadence, a fixed interval, or a one-time future instant.
- entity — Fires when an entity record is created, updated, or deleted.
- connector — Fires on a real-time webhook event from an authorized connector (Slack, Google Calendar, Drive, …).
- in_app_agent — Fires when a conversation starts with an in-app agent.
- app_user_auth — Fires when an app user signs up or logs in.
- app_publish — Fires when the app is published from the builder.
- app_payment — Fires when a payment succeeds or is refunded, or a subscription is canceled, in the app's payment provider.
- webhook — Fires on an inbound POST to a reusable workspace webhook URL, from any source. Use it for a third-party event no connector trigger covers - don't connect that provider or poll it to get the event.

### Activities (what a `call` step can do)
- app_security_scan — Security scan (same as the Security tab): `start` kicks it off, `results` reads the latest findings.
- compute_seconds_until — Computes the seconds from now until a target datetime — feed the result into a dynamic wait.
- invoke_server_route — Calls a route on the app's own server.

### Task Types (how steps are structured)
- call — invoke a registered activity with `with` args, then transition via `then`.
- wait — pause for an ISO-8601 duration (durable, survives restarts), then continue.
- switch — branch on ordered jq conditions; the last case is the catch-all `${ true }`.
</workflow_building_blocks>

<creating_workflows>
1. Read the authoring guide below. 2. Needed server routes first. 3. Connector triggers: authorize first. 4. Write `base44/workflows/<Name>.jsonc` (the envelope). 5. Auto-validation on save — fix anything reported as WORKFLOW ERROR.
Each write creates a new version; running workflows keep their starting version. Graph + run history: dashboard.
</creating_workflows>

<debugging_workflows>
`base44 workflows runs --app-id <APP_ID> --status failed` lists failed runs with the failing task and its error; `base44 logs --function <name>` reads that function's own logs; the Workflows dashboard shows each run's steps.
</debugging_workflows>
</workflows_capability>

# Workflow Authoring Guide

> **Filtered guide** — documents ONLY triggers: scheduled, entity, connector, in_app_agent, app_user_auth, app_publish, app_payment, webhook; activities: app_security_scan, compute_seconds_until, invoke_server_route. Any other trigger or activity is NOT covered here: do not author with it from memory — call this tool again with the names you need.

## File Convention

Workflows are `.jsonc` files under `base44/workflows/`.
- Path: `base44/workflows/<WorkflowName>.jsonc`
- Existing workflows: `base44 workflows list --app-id <APP_ID>` (runs: `base44 workflows runs --app-id <APP_ID>`), or the Workflows dashboard
- Create or update a workflow by writing its file
- Each write creates a new version. Already-running workflows keep the version they started with.
- After a successful write, the workflow is immediately active — scheduled triggers start firing, entity/connector triggers start listening.
- The workflow appears in the code view sidebar under Workflows and in the Workflows dashboard.

## Managing Workflow Status

Change lifecycle status (activate / deactivate / archive / unarchive) in the Workflows dashboard or through the platform API (the `workflows` area of the API catalog) — NOT file edits.

- Stop/pause/cancel all: refresh the list, deactivate every active workflow, and report failures before claiming success.
- Destructive broad/bulk workflows: encode user protections in the definition (not conversation memory), preview scope/count, and get approval before activation or active updates.

## Envelope Format

```json
{
  "name": "Human-Readable Workflow Name",
  "description": "What this workflow does",
  "trigger": { ... },
  "definition": { ... }
}
```

## CNCF Serverless Workflow v1.0 Definition

```json
{
  "document": { "dsl": "1.0.0", "name": "snake_case_id", "version": "1.0", "namespace": "base44" },
  "do": [
    { "task_name": { "call": "activity_name", "with": {}, "then": "next_task" } }
  ]
}
```

**Task naming**: must be snake_case (letters, digits, underscores). Task results are accessed in jq as `${ .task_name.field }` — hyphens break jq field access. Never start a task name with `_` — that namespace is reserved for the system and the save will be rejected.

**MANDATORY transitions** — there is no implicit sequential fallback; violations cause validation errors:
- Every `call` and `wait` task must have a `then` field: the name of the next task or `"end"` to terminate.
- `switch` tasks branch ONLY through their cases: every case must have its own `then`, the **last case must be the catch-all `{"when": "${ true }", "then": ...}`** ("otherwise") so every run takes an explicit, visible branch, and the switch task itself must NOT have a task-level `then` — with an exhaustive case list it would be dead code.
- A switch needs at least one real condition case besides the catch-all. A switch whose only case is `${ true }` is a no-op and is rejected.

**Execution model: strictly sequential.** Tasks run one at a time in `then` order — there is NO parallel execution, fork/join, or "branches running at the same time". Never fabricate "fan-out" / "converge" marker nodes (e.g. a pass-through switch) to make the graph look parallel: the graph would misrepresent what actually runs. If the user asks for parallel branches, explain that steps execute in sequence and model the flow as ordered steps.

## Supported Task Types

### call — invoke a registered activity
```json
{ "fetch_data": { "call": "invoke_server_route", "with": { "path": "/api/get-data", "body": {} }, "then": "next_task" } }
```

### switch — conditional branching
```json
{ "check": { "switch": [
    { "when": "${ .fetch_data.status == \"active\" }", "then": "handle_active" },
    { "when": "${ true }", "then": "end" }
] } }
```
Cases are evaluated in order — the first truthy `when` wins (transition rules above).

### wait — durable time delay (survives restarts)
```json
{ "pause": { "wait": "PT5M", "then": "next_task" } }
```
ISO 8601: PT5M = 5 min, PT1H = 1 hour, P1D = 1 day, P3DT12H = 3.5 days

## `x-base44` (display-only node labels - set on every task)

Set `x-base44` on every task for graph labels only — it never changes runtime behavior, task output, transitions, or activity inputs. Allowed sub-fields (anything else is rejected): `title` (node title — **always in the user's language**; the task key stays `snake_case` ASCII) and optional `description` (very short subtitle).

```json
{ "fetch_data": { "call": "invoke_server_route", "with": { "path": "/api/get-data" }, "then": "next_task", "x-base44": { "title": "Fetch order", "description": "Latest record" } } }
```

When editing, preserve `x-base44` where the task's purpose is unchanged; update `title`/`description` when the meaning changes — no stale labels.

## Available Activities

### app_security_scan
The app's security scan — the same scan as the builder's Security tab (RLS, secrets, backend functions, dependencies, static code). `action: start` starts a scan and returns at once, without findings. `action: results` reads the latest completed scan.
- When to use: Whenever a workflow needs the app's security posture or findings, on any trigger — to refresh them (`start`) or to read and act on them (`results`). A scan runs in the background for up to ~10 minutes, so `start` never returns findings: `wait` at least PT10M, then `results` passing `after: ${ .<start step>.requested_at }` so an older scan is reported as `pending`, not as ready. If `results` says `running`, wait PT5M and read once more. `results` alone is enough when the latest scan will do. Branch on `state` — only `ready` carries `scan`. Zero findings means clean only when `scan.status` is `up_to_date` and `scan.rls_scan_failed` is false. `scan.findings` is capped: severity-first, 50 by default — pass `max_findings` (up to 100) to raise it, check `findings_truncated`, and take the count from `total_findings`, never from the list length. If nothing changed since the last scan, `start` itself returns `ready` with that scan. Run now behaves like any other run: `start` really starts a scan.
- `action`: `start` to start a scan, or `results` to read the latest completed scan. Required.
- `after`: results only, optional. ISO-8601 datetime; a scan completed before it is reported as `pending` rather than `ready`. Pass the `requested_at` returned by the `start` step.
- `max_findings`: results only, optional. How many findings to include in `scan.findings`, severity-first (default 50, max 100); `scan.findings_truncated` says whether any were left out.
- Returns: {"action": "start" | "results", "state": str, "scan": {...} | null, "requested_at": str (start only; the `after` for a follow-up results — when state is "ready" it is the returned scan's own scanned_at, so results accepts it)}. start states: "started" (scan spawned), "running" (a scan is already in flight), "ready" (nothing changed since the last scan; `scan` is current). results states: "ready" (`scan` set), "running", "pending" (latest scan predates `after`), "failed" (last scan failed), "not_scanned". `scan` is set only when state is "ready": {"scanned_at": str, "status": "up_to_date" | "out_of_date" (as the Security tab shows it), "rls_scan_failed": bool (RLS section did not complete — empty RLS findings are not a clean result), "risk_level": str, "total_findings": int, "counts_by_severity": {severity: int}, "counts_by_category": {category: {severity: int}}, "finding_categories": [str], "findings": [{"category": "rls" | "secrets" | "backend_functions" | "dependencies" | "code" | "core_integration", "severity": str, "title": str, "description": str, "file_path"?: str, "line"?: int, "recommendation"?: str, "package_name"?: str, "current_version"?: str, "fixed_version"?: str, "vulnerability_id"?: str}], "findings_truncated": bool}. `start` never returns findings (its `scan.findings` is empty).

### compute_seconds_until
Compute seconds from now until a target datetime.
- `target_iso`: ISO 8601 datetime string
- Returns: {"seconds": float, "target_iso": str, "now_iso": str}

### invoke_server_route
Call a route served by the app's own full-stack server.
- When to use: Logic you write as code in one of the app's server routes: API calls, data fetching/transforms, entity CRUD, sending email/HTTP — no agent reasoning turn. A path that matches no route reaches the app's catch-all instead of failing, so copy it from the route file rather than guessing.
- `path`: App-relative route path, starting with '/' (e.g. '/api/orders/sync')
- `method`: HTTP method — GET, POST, PUT, PATCH or DELETE (default POST)
- `body`: Dict sent as the JSON request body (supports jq expressions)
- `query`: Dict of query-string parameters (supports jq expressions)
- Returns: Parsed JSON response from the route

## Choosing Between Activities

See each activity's "When to use" line above for what it's best at.

## jq Expression Language

Use `${ .field }` syntax (CNCF SWF v1.0).
- Trigger data: `${ .trigger.data.fieldname }`
- Task output: `${ .task_name.field }`
- Conditions: `${ .trigger.data.status == "active" }`
- String interpolation: `"Hello ${ .trigger.data.name }"`

**Write jq, not JavaScript/Python.** Common mistakes to avoid:
- Logic operators are `and` / `or` / `not`, never `&&` / `||` / `!`: `${ .trigger.data.a == 1 and .trigger.data.b != 2 }`.
- Membership is `${ .trigger.data.event.channel | IN("C1","C2") }`, never infix `x in [...]`.
- String tests (`test` / `contains` / `startswith` / `ascii_downcase`) throw on a null field — default first: `${ (.trigger.data.subject // "") | test("receipt"; "i") }`.
- Iteration throws on null — default with `// []`: `${ any((.trigger.data.items // [])[]; .qty > 0) }`.
- In a pipe, `.` is the piped value, not the root — bind root refs first: `${ .trigger.data.event.channel as $c | ["C1","C2"] | index($c) != null }`.

### Keep jq minimal

jq only reads the payload (trigger data + prior task outputs): field access, equality, simple boolean/arithmetic checks. Anything more — transformation, computation, lookups, multi-step branching — belongs in a server route (`invoke_server_route`), not in elaborate jq.
- Never use `env` / `$ENV`, `input`, `def`, `range`, `recurse`, `reduce`, `foreach`, `walk`, `..` — the save is rejected. jq cannot reach app secrets; only a server route can read and use an API key or signing secret.
- Good: `${ .trigger.data.status == "approved" }`. Bad: `${ env.API_KEY }`.

## Trigger Types

The trigger object wraps the type-specific fields (shown below) in `config`, plus an optional jq `condition` that must be truthy for the workflow to run:
```json
{ "config": { "trigger_type": "<type>", <type-specific fields — see your trigger's section> }, "condition": "${ <jq predicate over .trigger, optional> }" }
```

### scheduled
```json
{ "trigger_type": "scheduled", "cron_expression": "0 9 * * 1-5", "timezone": "America/New_York" }
```

**Webhook vs polling**: when the user wants to react to external events (calendar changes, new messages, CRM updates), prefer a connector trigger over scheduled polling — connector triggers deliver events in real time. Use scheduled polling only when no connector supports webhooks for the service (check the connector's details with `list_connectors`).

**Timezone**: Ask the user for their timezone when it is not known. When the user mentions times (e.g., "9am", "2pm", "midnight"), they mean times in THEIR timezone. Set the `timezone` field to the user's timezone — the cron expression is then evaluated in that timezone (no manual UTC conversion needed).

Cron format: `minute hour day-of-month month day-of-week`

**Choose cron vs interval FIRST.** Cron fires at clock-aligned times, so a "every N <unit>" request is only expressible in cron when N evenly divides its field's wrap period — minutes where N divides 60 (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30) or hours where N divides 24 (1, 2, 3, 4, 6, 8, 12). For any other fixed gap — "every 90 minutes", "every 45 minutes", "every 7 hours", "every 2 days" — cron CANNOT express it: use **interval mode** (see below). Never approximate with `*/90 * * * *` (most cron parsers reduce the out-of-range minute step to :00, collapsing it to hourly — some reject it outright) or `0 9 */2 * *` (the day-of-month step restarts every month, so it is not a true 2-day gap).

Translating user requests to cron (clock-aligned cadences):
- "every 5 minutes" → `*/5 * * * *` (minimum interval)
- "every hour" / "hourly" → `0 * * * *`
- "every day at 9am" / "daily at 9" → `0 9 * * *`
- "every weekday at 9am" / "Monday to Friday" → `0 9 * * 1-5`
- "every Monday at 10am" → `0 10 * * 1`
- "every Monday and Friday at 10am" → `0 10 * * 1,5`
- "every month on the 15th" → `0 0 15 * *`
- "every month on the 1st at 9am" → `0 9 1 * *`
- "twice a day at 9am and 5pm" → `0 9,17 * * *`
- "every 30 minutes during business hours" → `*/30 9-17 * * 1-5`
- "every Sunday at midnight" → `0 0 * * 0`

**Run once** (instead of recurring): set `schedule_mode` to `"one_time"` with a future UTC instant — no cron_expression needed:
```json
{ "trigger_type": "scheduled", "schedule_mode": "one_time", "one_time_date": "2026-07-01T16:00:00Z" }
```
`one_time_date` is a future UTC instant. Never guess "now" — take the current local time from the user, resolve the user's request against it (relative "in N minutes" or a clock time like "9:12am"), then convert to UTC.

**Recurring at a fixed interval** — use this for any "every N minutes/hours/days" the cron rule above says cron can't express (e.g. "every 90 minutes", "every 45 minutes", "every 7 hours", "every 2 days"). Set `schedule_mode` to `"interval"` and DO NOT set `cron_expression`:
```json
{ "trigger_type": "scheduled", "schedule_mode": "interval", "interval_value": 2, "interval_unit": "days", "interval_anchor": "2026-07-01T09:00:00Z" }
```
Units: minutes | hours | days only. Minimum interval is 5 minutes. `interval_anchor` (UTC) sets the phase — when the user gives a time-of-day or start ("every 2 days at 9am", "every 90 minutes starting 14:00") set it to that UTC instant; omit it to align to the epoch. For calendar cadences (specific weekdays, day-of-month, weekly, monthly) use cron.

**End conditions** (recurring schedules only, default is run forever):
- Stop on a date: add `"ends_type": "on_date", "ends_on_date": "2026-12-31T23:59:00Z"` — the last instant the schedule may fire (UTC).
- Stop after N runs: add `"ends_type": "after_count", "ends_after_count": 10`.

When a schedule finishes (one-time fired, end date passed, or run count reached) the workflow is automatically archived.

### entity
```json
{ "trigger_type": "entity", "entity_name": "orders", "events": ["create", "update"] }
```

Trigger payload structure:
- `${ .trigger.entity_name }` — entity name (e.g. "orders")
- `${ .trigger.entity_id }` — the entity record ID
- `${ .trigger.event_type }` — "create", "update", or "delete"
- `${ .trigger.data.* }` — current entity data
- `${ .trigger.old_data.* }` — previous data (update events only)
- `${ .trigger.changed_fields }` — array of top-level field names that changed
- `${ .trigger.payload_too_large }` — true when the record was too large to attach (see note below)

Condition examples:
- Only when status changes to "completed":
  `"condition": "${ .trigger.data.status == \"completed\" and .trigger.old_data.status != \"completed\" }"`
- Only when a specific field changed:
  `"condition": "${ .trigger.changed_fields | index(\"status\") != null }"`
- Only for a specific entity value:
  `"condition": "${ .trigger.data.priority == \"high\" }"`

Note: when the entity record is very large (over ~256KB), `data` and `old_data` arrive as null and `payload_too_large` is true (`changed_fields` stays populated). Trigger conditions still evaluate against the full data, but the server route must re-fetch the record by id using the Base44 SDK: `await base44.asServiceRole.entities["entity_name"].get(entity_id)`.

Use `read_file("base44/entities/<EntityName>.jsonc")` to check entity field names before writing conditions.

### connector
```json
{"trigger_type": "connector", "integration_type": "slack", "events": ["message"]}
```

Optional: `resource_id` — for Google Calendar (calendar ID, e.g. "primary" or "user@gmail.com") or Google Drive (file ID). Controls which webhook registration is used (scopes the provider subscription, not per-workflow dispatch filtering).
```json
{"trigger_type": "connector", "integration_type": "googlecalendar", "events": ["events"], "resource_id": "primary"}
```

Prerequisites:
- The connector must be authorized (use the Base44 MCP connector tools `list_connectors` and `initiate_connector_connection`, or `base44 connectors`). The webhook registration is set up automatically when the workflow is saved.
- Each provider has a different payload structure and auth model. Always read the connector's usage guide (`list_connectors` with the integration type) for the provider-specific webhook handler guide BEFORE writing the server route.

Trigger payload:
- `${ .trigger.integration_type }` — e.g. "slack", "googlecalendar"
- `${ .trigger.event_type }` — the webhook event type
- `${ .trigger.data.* }` — the raw webhook payload from the provider
- `${ .trigger.payload_too_large }` — true when the webhook payload was too large to attach (over ~256KB); `data` arrives as null (conditions still evaluate against the full payload) and the server route must re-fetch the resource from the provider

Condition field paths use the provider's webhook payload structure:
- Slack: `${ .trigger.data.event.channel == \"C0123ABC\" }`, `${ .trigger.data.event.user == \"U0123ABC\" }`
- Google Calendar: `${ .trigger.data.resource_id == \"calendar_id\" }`

**Important**: When the user provides a human-readable name (e.g. "#general"), the webhook payload uses internal IDs. Resolve the name to an ID first: create a temporary server route that uses the authorized connector to look up the ID, request it once, then use the returned ID in the condition. Never guess IDs.

High-volume connectors (e.g. Slack) require conditions — validation will reject triggers without them.

If activation fails with `MISSING_WEBHOOK_SCOPES`, re-connect that connector (`initiate_connector_connection`, or `base44 connectors initiate`) with the union of its granted and missing scopes (re-authorization replaces the grant, so omitting the granted ones drops them), then save the workflow again.

Available connectors:
  (no connectors with webhook support)

### in_app_agent
```json
{ "trigger_type": "in_app_agent", "agent_name": "support_agent", "events": ["conversation_started"] }
```
Omit `agent_name` to trigger for all in-app agents. `events` is required — currently only `"conversation_started"` is supported.

Trigger payload structure:
- `${ .trigger.agent_name }` — the agent name (top-level shorthand)
- `${ .trigger.data.event.type }` — always "conversation_started"
- `${ .trigger.data.event.agent_name }` — agent that received the message
- `${ .trigger.data.event.conversation_id }` — conversation ID
- `${ .trigger.data.event.message_id }` — first message ID
- `${ .trigger.data.event.channel }` — channel (e.g. "web", "mobile")
- `${ .trigger.data.message.text }` — first message text
- `${ .trigger.data.message.has_files }` — whether files were attached
- `${ .trigger.data.app_user.id }` — app user ID
- `${ .trigger.payload_too_large }` — true when the first message was too large to attach (over ~256KB); `data.message` arrives as null but the event IDs remain, so fetch the conversation by `data.event.conversation_id`

### app_user_auth
```json
{ "trigger_type": "app_user_auth", "events": ["signup", "login"] }
```

app_user_auth fields live on `.trigger` directly — do NOT use `.trigger.data.*` for this trigger.

Trigger payload fields (use `${ .trigger.<field> }` in conditions and `do` args):
- `${ .trigger.event_type }` — "signup" or "login"
- `${ .trigger.auth_method }` — "password", "google", "microsoft", "facebook", "apple", "app_sso", or "workspace_sso"
- `${ .trigger.occurred_at }` — ISO timestamp for the successful auth transaction
- `${ .trigger.user_id }` — app-user ID string (preferred for server-route body)
- `${ .trigger.email }` — app-user email
- `${ .trigger.full_name }` — app-user display name
- `${ .trigger.role }` — app-user role
- `${ .trigger.app_user.id }` — same ID as user_id
- `${ .trigger.app_user.collaborator_role }` — collaborator role, when present
- `${ .trigger.app_user.is_verified }` — whether the app user is verified

Canonical `invoke_server_route` body (same for signup and login):
```json
"body": {
  "user_id": "${ .trigger.user_id }",
  "email": "${ .trigger.email }",
  "auth_method": "${ .trigger.auth_method }"
}
```
Do NOT pass `${ .trigger.app_user }` as user_id — it is an object, not a string.

When each event fires (depends on whether the app is public or private):

**Public apps:**
- **signup** — the end user's first successful sign-in (email/password or social login).
- **login** — every later successful sign-in.

**Private or workspace apps:**
- **signup** — when an admin approves a new user's access request. Does not fire on first login.
- **login** — every successful sign-in after the user exists, including the first sign-in after approval.

Condition examples:
- Only password auth:
  `"condition": "${ .trigger.auth_method == \"password\" }"`
- Only Google signups:
  `"condition": "${ .trigger.event_type == \"signup\" and .trigger.auth_method == \"google\" }"`
- Only workspace SSO logins:
  `"condition": "${ .trigger.auth_method == \"workspace_sso\" }"`
- Only admin app users:
  `"condition": "${ .trigger.role == \"admin\" }"`

### app_publish
```json
{ "trigger_type": "app_publish", "events": ["published"] }
```

app_publish fields live on `.trigger` directly — do NOT use `.trigger.data.*` for this trigger.

Trigger payload fields (use `${ .trigger.<field> }` in conditions and `do` args):
- `${ .trigger.event_type }` — always "published"
- `${ .trigger.occurred_at }` — ISO timestamp of the publish
- `${ .trigger.is_first_publish }` — true only on the app's first-ever publish
- `${ .trigger.visibility }` — published visibility ("private_with_login", "workspace_with_login", "public_with_login", or "public_without_login")
- `${ .trigger.published_by }` — platform user ID of the publisher, null for API-key publishes

Fires on every successful publish, including restoring a previous version. Does not fire on unpublish.

Condition examples:
- Only the first publish (launch):
  `"condition": "${ .trigger.is_first_publish }"`

### app_payment
```json
{ "trigger_type": "app_payment", "events": ["payment_succeeded"] }
```

Requires a connected payment provider (Stripe, PayPal, Wix Payments, or Payments by Wix): activating a workflow with this trigger fails when none is connected. Connect a provider first, then create the workflow. The payload is normalized across providers; workflows never receive provider-shaped raw data.

Valid events: `payment_succeeded` (a successful payment: a completed checkout and the first payment of a subscription), `payment_refunded` (an approved refund, including one made from the Payments dashboard or the provider's own site), `subscription_canceled` (a subscription stopped billing: canceled or ended on Stripe and PayPal, and paused/suspended on PayPal only, e.g. by the buyer in PayPal or after failed payments; a Stripe pause fires nothing; a PayPal subscription resumed outside the app fires nothing and `listPurchases` can't show it, so tell the user to restore that access by hand). Failed payment attempts do NOT fire this trigger.

Use `payment_refunded` and `subscription_canceled` to revoke what a purchase granted: match the event to the purchase the app saved by whichever of `subscription_id`, `checkout_id` and `payment_id` it carries, and make the revoke idempotent.

Recurring subscription renewal charges are wired to fire `payment_succeeded` too, but delivery is not enabled yet for every Stripe account. Do not build a workflow whose only purpose is reacting to renewals, and tell the user renewals may not fire yet if they ask for one. The same holds for `subscription_canceled` on Stripe; on PayPal both fire.

When renewals do arrive, the payload does not distinguish them from a first subscription payment — both are `payment_succeeded` with `mode: "subscription"`. So do not use this trigger for one-time-only actions on a subscription (welcome emails, provisioning, granting access) without your own guard, e.g. an entity record keyed by `provider_customer_id` that the workflow checks and writes.

app_payment fields live on `.trigger` directly — do NOT use `.trigger.data.*` for this trigger.

Trigger payload fields (use `${ .trigger.<field> }` in conditions and `do` args):
- `${ .trigger.event_type }`: "payment_succeeded", "payment_refunded" or "subscription_canceled"
- `${ .trigger.provider }`: "stripe", "paypal", "wix_payments", or "payments_by_wix"
- `${ .trigger.amount }`: integer amount in cents for most currencies (e.g. 2500 = $25.00), matching the platform's payment analytics representation; 0 on `subscription_canceled`
- `${ .trigger.currency }` — lowercase ISO currency code (e.g. "usd")
- `${ .trigger.is_live }` — false for test/sandbox payments; test payments DO fire this trigger
- `${ .trigger.mode }`: "payment" (one-off checkout) or "subscription" (a subscription charge, first payment OR renewal, indistinguishable); null on refunds. Only Stripe and PayPal distinguish these; Wix payments always report "payment"
- `${ .trigger.occurred_at }` — ISO timestamp of the provider event
- `${ .trigger.provider_customer_id }` — provider-side customer/contact ID, or null
- `${ .trigger.provider_transaction_id }`: provider-side transaction/session/refund ID, for logs; look purchases up by the ids below instead
- `${ .trigger.provider_event_id }` — provider webhook event ID (webhook redeliveries are already deduped on it — don't build your own guard)
- `${ .trigger.checkout_id }`, `${ .trigger.subscription_id }`, `${ .trigger.payment_id }`: the same ids `base44.payments` returns on a purchase; each is null when the provider does not name it on that event (Wix events carry none; a Stripe renewal carries only `subscription_id`; a refund carries `payment_id`, plus `subscription_id` when it refunds a subscription charge)
- `${ .trigger.subscription_status }`: on `subscription_canceled`: "canceled" (canceled or ended) or "paused" (can resume); null otherwise

The payload carries no payer email or other PII. When needed, look the purchase up in a server route, as service role, with `payments.listPurchases({ subscription_id })` when the event names one, else `({ checkout_id })`, which returns `buyer_email`. Never call `listPurchases` with neither id: unscoped it lists every buyer's purchases. Events that carry neither (Wix, or a Stripe payment made outside a checkout) are re-fetched by `provider_transaction_id` from the provider's API instead. Zero-amount payments and refunds (free checkouts, 100% discounts) do not fire.

Condition examples:
- Only real (live-mode) payments:
  `"condition": "${ .trigger.is_live }"`
- Only large payments (over $100):
  `"condition": "${ .trigger.amount > 10000 }"`

### webhook

A workspace webhook must already exist — this trigger listens on one, it does
not create one. Pick an existing workspace webhook or create one on the Dashboard's Webhooks page (or through
the platform API), and write its id here. Reuse an existing
one where you can: many providers allow only a single webhook URL per account,
so a second listener for the same provider usually cannot be wired up at all.

```json
{ "trigger_type": "webhook", "webhook_id": "<id from the tool>",
  "webhook_name": "hubspot-events", "events": ["contact.creation"] }
```

`webhook_id` is the reference — never a URL and never a token. You cannot guess
or invent it: it only exists once a tool hands it to you, and an id that is not
in this workspace blocks activation with `WEBHOOK_NOT_FOUND`.

`webhook_name` is the listener's display name at authoring time. It is carried for
readability only and is never resolved against — the user may rename the
listener, which changes the label and nothing else.

One webhook URL commonly carries several event types. `events` filters which
ones run this workflow; an empty list subscribes to all of them. Reusing a
webhook across workflows is normal and preferred — many providers allow only
one webhook URL per account. Only set `events` when the webhook classifies
event types; otherwise activation fails with `WEBHOOK_HAS_NO_EVENT_TYPES`.

Trigger payload (use `${ .trigger.* }` in conditions and `do` args):
- `${ .trigger.data.<field> }` — the parsed request body, e.g. `${ .trigger.data.properties.email }`
- `${ .trigger.event_type }` — the event type this request was classified as
- `${ .trigger.webhook_name }` — the webhook's display name (may have changed since authoring)
- `${ .trigger.webhook_id }` — the webhook's id, stable across renames
- `${ .trigger.headers.<name> }` — request headers, lowercased, credentials removed
- `${ .trigger.query.<name> }` — query-string params, credentials removed

`${ .trigger.data }` arrives as `null` when the body was too large to forward.
Unlike an entity trigger there is nothing to re-fetch — the body is never
persisted — so a workflow that must tolerate big payloads should branch on the
absence rather than assume the field is there.

Condition example — only enterprise-tier contacts:
`"condition": "${ .trigger.data.properties.tier == \"enterprise\" }"`

## Designing Steps: When to Split vs Combine

**Split** into separate tasks when operations are independent (a failure shouldn't re-run the others), a delay sits between them, or you want per-step visibility and retry granularity in the run log. **Combine** into one step when operations share setup/auth/transaction, must be atomic, or the second needs the first's full in-memory result.

**Conditions**: use a `switch` when the outcome picks the path (skip steps, branch, end early — visible in the graph); keep validation/error handling inside the step. Rule of thumb: a flowchart diamond goes in the workflow; an implementation if-statement stays in the step.

## Important Notes

- Create the server route BEFORE the workflow that calls it.
- A step calls the server route as the workflow's creator, an app admin, but its URL is public. One only workflows call must set `server: { middleware: [requireUserRoute], handlers }` from `@/lib/auth-middleware`, return 403 unless `context.user.role === "admin"`, then use `context.getBase44().asServiceRole`; never a shared secret. One the app's users also call keeps its usual checks.
- Never put a secret value (API key, token, password) in a workflow — not in step args, conditions or anywhere else. The server route reads the secret from the app's secrets itself.
- Infinite loop prevention: if a workflow has an entity trigger AND creates the same entity type, add a condition to distinguish source entities from workflow-created ones.
- Validation runs automatically on write. Fix errors shown in WORKFLOW ERROR messages and retry.
- Some workflow files carry an `x-base44-migrated-from-automation` marker naming a `legacy_payload_function`. The step calling that function is on a compatibility layer keyed to the function's **name** — while the step calls it, the function receives a legacy input shape. You can change the function's internal logic, but don't change how it consumes its input. To change its inputs or replace it, point the step at a **new** function (different name) written normally — the different name turns the layer off. Other and new steps are normal.

## Examples

> Envelope examples below are written as `write_file(path, envelope)`: create the file at `path` with the envelope as its content.

### "Clean up old data every night at 2am"
1. Add server route: `POST /api/cleanup-old-data`
2. Create workflow:
```json
write_file("base44/workflows/Nightly Cleanup.jsonc", {
  "name": "Nightly Cleanup",
  "description": "Cleans up old data every night at 2am",
  "trigger": { "config": { "trigger_type": "scheduled", "cron_expression": "0 2 * * *", "timezone": "<user_timezone>" } },
  "definition": {
    "document": { "dsl": "1.0.0", "name": "nightly_cleanup", "version": "1.0", "namespace": "base44" },
    "do": [{ "cleanup": { "call": "invoke_server_route", "with": { "path": "/api/cleanup-old-data" }, "then": "end" } }]
  }
})
```

### "When an order status changes to completed, send a confirmation and wait 3 days, then request a review"
1. Add two server routes: `POST /api/send-confirmation` and `POST /api/request-review`
2. Create workflow:
```json
write_file("base44/workflows/Order Followup.jsonc", {
  "name": "Order Followup",
  "description": "Sends confirmation on order completion, then requests review after 3 days",
  "trigger": {
    "config": { "trigger_type": "entity", "entity_name": "orders", "events": ["update"] },
    "condition": "${ .trigger.data.status == \"completed\" and .trigger.old_data.status != \"completed\" }"
  },
  "definition": {
    "document": { "dsl": "1.0.0", "name": "order_followup", "version": "1.0", "namespace": "base44" },
    "do": [
      { "send_confirmation": { "call": "invoke_server_route", "with": { "path": "/api/send-confirmation", "body": { "order_id": "${ .trigger.entity_id }" } }, "then": "wait_period" } },
      { "wait_period": { "wait": "P3D", "then": "request_review" } },
      { "request_review": { "call": "invoke_server_route", "with": { "path": "/api/request-review", "body": { "order_id": "${ .trigger.entity_id }" } }, "then": "end" } }
    ]
  }
})
```

### "When someone messages in #general on Slack, log it"
1. Ensure Slack is connected (`list_connectors`, `initiate_connector_connection`)
2. Resolve "#general" to channel ID: create temp function, call Slack API, get "C0123ABC"
3. Add server route: `POST /api/log-slack-message`
4. Create workflow with condition:
```json
write_file("base44/workflows/Slack Logger.jsonc", {
  "name": "Slack Logger",
  "description": "Logs messages from #general channel",
  "trigger": {
    "config": { "trigger_type": "connector", "integration_type": "slack", "events": ["message"] },
    "condition": "${ .trigger.data.event.channel == \"C0123ABC\" }"
  },
  "definition": {
    "document": { "dsl": "1.0.0", "name": "slack_logger", "version": "1.0", "namespace": "base44" },
    "do": [{ "log_message": { "call": "invoke_server_route", "with": { "path": "/api/log-slack-message", "body": { "text": "${ .trigger.data.event.text }", "user": "${ .trigger.data.event.user }" } }, "then": "end" } }]
  }
})
```

### "When someone starts a chat with the Support agent, create a ticket and notify the team"
1. Add two server routes: `POST /api/create-support-ticket` and `POST /api/notify-team`
2. Create workflow:
```json
write_file("base44/workflows/Support Ticket.jsonc", {
  "name": "Support Ticket",
  "description": "Creates a ticket and notifies team when a support conversation starts",
  "trigger": {
    "config": { "trigger_type": "in_app_agent", "agent_name": "Support", "events": ["conversation_started"] }
  },
  "definition": {
    "document": { "dsl": "1.0.0", "name": "support_ticket", "version": "1.0", "namespace": "base44" },
    "do": [
      { "create_ticket": { "call": "invoke_server_route", "with": { "path": "/api/create-support-ticket", "body": { "message": "${ .trigger.data.message.text }", "user_id": "${ .trigger.data.app_user.id }" } }, "then": "notify" } },
      { "notify": { "call": "invoke_server_route", "with": { "path": "/api/notify-team", "body": { "ticket_id": "${ .create_ticket.id }", "agent": "${ .trigger.data.event.agent_name }" } }, "then": "end" } }
    ]
  }
})
```

### "When someone signs up or logs in with a password, record it in the audit log"
1. Add server route: `POST /api/on-password-auth`
2. Create workflow:
```json
write_file("base44/workflows/On Password Auth.jsonc", {
  "name": "On Password Auth",
  "description": "Records password signups and logins in the audit log",
  "trigger": {
    "config": { "trigger_type": "app_user_auth", "events": ["login", "signup"] },
    "condition": "${ .trigger.auth_method == \"password\" }"
  },
  "definition": {
    "document": { "dsl": "1.0.0", "name": "on_password_auth", "version": "1.0", "namespace": "base44" },
    "do": [{ "write_audit": { "call": "invoke_server_route", "with": { "path": "/api/on-password-auth", "body": { "user_id": "${ .trigger.user_id }", "email": "${ .trigger.email }", "activity": "${ .trigger.event_type }" } }, "then": "end" } }]
  }
})
```

### "When the app is published for the first time, notify the team"
1. Add server route: `POST /api/on-app-launched`
2. Create workflow:
```json
write_file("base44/workflows/On First Publish.jsonc", {
  "name": "On First Publish",
  "description": "Notifies the team when the app is published for the first time",
  "trigger": {
    "config": { "trigger_type": "app_publish", "events": ["published"] },
    "condition": "${ .trigger.is_first_publish }"
  },
  "definition": {
    "document": { "dsl": "1.0.0", "name": "on_first_publish", "version": "1.0", "namespace": "base44" },
    "do": [{ "notify_team": { "call": "invoke_server_route", "with": { "path": "/api/on-app-launched", "body": { "published_at": "${ .trigger.occurred_at }", "visibility": "${ .trigger.visibility }" } }, "then": "end" } }]
  }
})
```

### "When someone pays, send a thank-you email"
1. Add server route: `POST /api/send-payment-thank-you`: as service role it calls `payments.listPurchases({ subscription_id })` when given one, else `({ checkout_id })`, and else, with neither id, re-fetches the payer from the provider's API by `transaction_id`; it emails that `buyer_email`, and sends nothing when no purchase matches
2. Create workflow:
```json
write_file("base44/workflows/On Payment.jsonc", {
  "name": "On Payment",
  "description": "Sends a thank-you email when a live payment succeeds",
  "trigger": {
    "config": { "trigger_type": "app_payment", "events": ["payment_succeeded"] },
    "condition": "${ .trigger.is_live }"
  },
  "definition": {
    "document": { "dsl": "1.0.0", "name": "on_payment", "version": "1.0", "namespace": "base44" },
    "do": [{ "send_thank_you": { "call": "invoke_server_route", "with": { "path": "/api/send-payment-thank-you", "body": { "checkout_id": "${ .trigger.checkout_id }", "subscription_id": "${ .trigger.subscription_id }", "transaction_id": "${ .trigger.provider_transaction_id }", "amount": "${ .trigger.amount }", "currency": "${ .trigger.currency }" } }, "then": "end" } }]
  }
})
```

### Refresh, then act on the findings — the start / wait / results pattern (any trigger)
Point the `ready` branch at whatever step consumes `${ .read.scan }` (its `findings`, `total_findings`, `risk_level`).
```json
"do": [
  { "scan": { "call": "app_security_scan", "with": { "action": "start" }, "then": "settle" } },
  { "settle": { "wait": "PT15M", "then": "read" } },
  { "read": { "call": "app_security_scan", "with": { "action": "results", "after": "${ .scan.requested_at }" }, "then": "route" } },
  { "route": { "switch": [
      { "ready": { "when": "${ .read.state == \"ready\" }", "then": "end" } },
      { "running": { "when": "${ .read.state == \"running\" }", "then": "settle_again" } },
      { "other": { "then": "end" } }
  ] } },
  { "settle_again": { "wait": "PT5M", "then": "read_again" } },
  { "read_again": { "call": "app_security_scan", "with": { "action": "results", "after": "${ .scan.requested_at }" }, "then": "end" } }
]
```
