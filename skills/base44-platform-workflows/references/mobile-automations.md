<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 workflows: Automations (mobile apps)

<automations_capability>
You can manage automations to run backend functions automatically - on a schedule, when entity records change, when external services send webhook events, or when app users start in-app agent conversations.

<user_timezone>
Times the user mentions are local to them — ask for their timezone when it is unknown.

IMPORTANT: When the user mentions times (e.g., "9am", "2pm", "midnight"), they mean times in THEIR timezone.
- All times you provide (one_time_date, ends_on_date, start_time) should be in the user's local time - they will be automatically converted to UTC.
- For cron_expression: Times in cron are in UTC, so you need to calculate the UTC equivalent based on the user's timezone.
</user_timezone>

<managing_automations>
Automations are not files: create, update, toggle and delete them in the dashboard (Automations) or through the platform API (the `automations` area of the API catalog). The parameters below are the ones those surfaces accept, named as the builder passes them.
</managing_automations>

<automation_types>
**Scheduled Automations (automation_type="scheduled"):**
Run a function on a schedule.

Simple schedules (schedule_type="simple"):
- Every 5 minutes: repeat_interval=5, repeat_unit="minutes" (minimum is 5 minutes)
- Hourly: repeat_interval=1, repeat_unit="hours"
- Daily at specific time: repeat_interval=1, repeat_unit="days", start_time="09:00"
- Weekly on specific days: repeat_unit="weeks", repeat_on_days=[1, 5], start_time="10:00" (0=Sunday, 6=Saturday)
- Monthly on specific day: repeat_unit="months", repeat_on_day_of_month=15, start_time="00:00"

Cron schedules (schedule_type="cron"):
- Use standard cron: "minute hour day-of-month month day-of-week"
- Example: "*/5 * * * *" = every 5 minutes (minimum interval is 5 minutes)
- Example: "0 9 * * 1-5" = 9am every weekday

One-time schedules (schedule_mode="one-time"):
- Run once: one_time_date="2024-01-15T10:00:00"

End conditions:
- ends_type="never": Run indefinitely (default)
- ends_type="on": Run until a date (ends_on_date="2024-12-31T23:59:59")
- ends_type="after": Run N times (ends_after_count=10)

**Entity Automations (automation_type="entity"):**
Run a function when entity records are created, updated, or deleted.

Required: entity_name, event_types (array of: "create", "update", "delete")

Examples:
- Send email on new order: entity_name="orders", event_types=["create"]
- Track status changes: entity_name="orders", event_types=["update"]
- Cleanup on delete: entity_name="users", event_types=["delete"]
- Multiple events: entity_name="orders", event_types=["create", "update"]

The function receives a payload with:
- event: { type, entity_name, entity_id }
- data: current entity data (null if payload_too_large is true)
- old_data: previous data (only for "update" events, null if payload_too_large is true)
- changed_fields: array of top-level field names that changed between old_data and data (e.g. ["status", "amount"])
- payload_too_large: true if entity data exceeded 200KB and was omitted. Use Base44 SDK to fetch: `await base44.entities.get("entity_name", entity_id)`

Optional: trigger_conditions — pre-filter which entity events actually trigger execution.
Use when the user only wants to act on specific changes (e.g., only when status becomes "completed", or only when a specific field changed).

Entity conditions evaluate against a wrapped object (this wrapping applies ONLY to entity automations, NOT connector automations):
{
  "data": { ...current entity fields... },
  "old_data": { ...previous entity fields (update events only)... },
  "changed_fields": ["field1", "field2", ...]
}

Field paths MUST use the wrapping key as prefix:
- "data.<field>" — current entity value (e.g. "data.status")
- "old_data.<field>" — previous value before the update (e.g. "old_data.status")
- "changed_fields" — the list itself; use "contains" operator to check if a field changed

Example — only fire when status changes to "completed":
trigger_conditions={
  "logic": "and",
  "conditions": [
    {"field": "changed_fields", "operator": "contains", "value": "status"},
    {"field": "data.status", "operator": "equals", "value": "completed"}
  ]
}

**In-App Agent Automations (automation_type="in_app_agent"):**
Run a function when an app user starts a new conversation with an in-app agent.

Required: function_name
Optional: agent_name (exact configured agent name; omit on create for all in-app agents; pass "" on update to clear a specific agent), event_types (array; currently only "conversation_started")

Use this trigger when the user wants to react to app-user conversations in an in-app agent. Do NOT implement this with scheduled polling.

The function receives a payload with:
- automation: { id, type, name }
- event: { type, agent_name, conversation_id, message_id, channel }
- message: { text, has_files }
- app_user: { id }
- payload_too_large: true if the message text was omitted because it was too large

Example:
- Notify on a new support chat: agent_name="Support", event_types=["conversation_started"]

**Connector Automations (automation_type="connector"):**
Run a function when a connected external service sends a webhook event (e.g., new calendar event, Google Drive file change).

Required: integration_type (e.g., "googlecalendar", "googledrive"), events (array of event names), function_name
Optional: resource_id (for Google Drive/Calendar - specific file or calendar to watch)

Prerequisites:
- The connector must be authorized first (see the `base44-platform-connectors` skill)
- The backend function to handle the webhook must exist before creating the automation

Each provider has a different payload structure and auth model. Always read the connector's usage guide (`list_connectors` with the integration type) BEFORE writing the function.

Optional: trigger_conditions — pre-filter which webhook events actually trigger execution.
Use when the user only wants to act on a subset of events (e.g., a specific Slack channel, a specific Drive folder).

trigger_conditions format:
{
  "logic": "and",
  "conditions": [
    {"field": "<dot.path>", "operator": "<op>", "value": "<target>"}
  ]
}

- "field": dot-path into the provider's RAW webhook payload. Do NOT prefix with "data." — unlike entity conditions, connector conditions evaluate directly against the webhook payload as received from the provider.
  For example, for Slack: "event.channel", "event.text", "event.user" (NOT "data.event.channel").
  You MUST know the provider's webhook payload structure — consult the provider's public API docs to determine the correct field paths.
- "operator": equals | not_equals | gt | gte | lt | lte | contains | not_contains | starts_with | ends_with | in_list | not_in_list | exists | not_exists | is_empty | is_not_empty
- "value": the concrete value to match. When the user provides a human-readable name but the webhook payload carries an internal ID, resolve the name first: create a temporary backend function that uses the authorized connector to look up the ID, invoke it, then use the returned ID as the condition value. Never guess IDs.
</automation_types>

<usage_guidelines>
Webhook vs polling:
When the user wants their app to react to external events (calendar changes, new messages, CRM updates, etc.),
Try using a connector automation (automation_type="connector") instead of a scheduled poll.
Connector automations deliver events in real time via webhooks and are more efficient and responsive than polling on a schedule.
Only fall back to scheduled polling when there is no connector with webhook support for the service in question.
Check the connector's details to see whether it supports webhooks before choosing scheduled polling.

In-app agent conversation triggers:
When the user wants their app to react to a user starting or sending the first message in an in-app agent conversation,
use an in-app agent automation (automation_type="in_app_agent") with event_types=["conversation_started"].
Do not create a scheduled automation that checks for recent conversations.

Other guidelines:
1. First, ensure the backend function exists before creating an automation for it
2. For connector automations, ensure the connector is authorized before creating the automation
3. Check existing automations in the dashboard or API before adding one
4. Use descriptive names for automations to make them easy to identify
5. Pause/resume automations from the dashboard or API
6. Minimum interval for scheduled automations is 5 minutes
</usage_guidelines>

</automations_capability>
