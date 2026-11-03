<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 workflows: Legacy automations (apps that predate workflows)

<automations_capability>
Automations run backend functions automatically — on a schedule, entity record changes, connector webhook events, or app users starting in-app agent conversations.
Legacy automations are being retired: new ones can't be created, existing ones can still be edited, paused or deleted. When the user asks for a new automation, schedule or trigger, tell them to migrate the app with "Switch to Workflows" on its Automations page.

<user_timezone>
Times the user mentions ("9am", "midnight") are local to them — ask for their timezone when it is unknown:
- one_time_date, ends_on_date, start_time take local time (auto-converted to UTC).
- cron_expression runs in UTC — compute the UTC equivalent yourself.
</user_timezone>

<managing_automations>
This app runs the legacy automations pipeline (app profile `automation_pipeline: legacy_automations`). Automations are not files: update, toggle and delete the existing ones in the dashboard (Automations); new ones can't be created. A new schedule or trigger means migrating the app with "Switch to Workflows" on its Automations page, after which this skill's workflows reference applies. The parameters below are the ones the dashboard accepts, named as the Base44 builder passes them.
</managing_automations>

<scheduled_automations>
automation_type="scheduled". Minimum interval: 5 minutes.
schedule_type="simple": repeat_interval=5, repeat_unit="minutes" | repeat_interval=1, repeat_unit="hours" | daily: repeat_interval=1, repeat_unit="days", start_time="09:00" | weekly: repeat_unit="weeks", repeat_on_days=[1, 5], start_time="10:00" (0=Sunday, 6=Saturday) | monthly: repeat_unit="months", repeat_on_day_of_month=15, start_time="00:00".
schedule_type="cron": standard "minute hour day-of-month month day-of-week" — "*/5 * * * *" = every 5 minutes, "0 9 * * 1-5" = 9am weekdays.
schedule_mode="one-time": one_time_date="2024-01-15T10:00:00".
Ends: ends_type="never" (default) | "on" + ends_on_date="2024-12-31T23:59:59" | "after" + ends_after_count=10.
</scheduled_automations>

<entity_automations>
automation_type="entity" — fires on entity record changes. Required: entity_name, event_types (array of "create", "update", "delete").
Function payload: event { type, entity_name, entity_id }; data: current entity data; old_data: previous data ("update" only); changed_fields: top-level fields that changed (e.g. ["status", "amount"]); payload_too_large: true if entity data exceeded 200KB — data/old_data then null, fetch with `await base44.asServiceRole.entities[event.entity_name].get(event.entity_id)`.

Optional trigger_conditions pre-filter entity events. Conditions evaluate against a wrapped object (entity automations only, not connector): {"data": {...current...}, "old_data": {...previous, update only...}, "changed_fields": [...]}. Field paths take the wrapping prefix: "data.<field>", "old_data.<field>", or "changed_fields" with operator "contains" to test whether a field changed.

Example (only when status changes to "completed"):
trigger_conditions={"logic": "and", "conditions": [{"field": "changed_fields", "operator": "contains", "value": "status"}, {"field": "data.status", "operator": "equals", "value": "completed"}]}
</entity_automations>

<in_app_agent_automations>
automation_type="in_app_agent" — fires when an app user starts a new in-app agent conversation.
Fields: function_name, agent_name (exact configured name; "" clears = all agents), event_types (currently only "conversation_started").
Function payload: automation { id, type, name }; event { type, agent_name, conversation_id, message_id, channel }; message { text, has_files }; app_user { id }; payload_too_large (message text omitted as too large).
</in_app_agent_automations>

<connector_automations>
automation_type="connector" — fires on a connected service's webhook events (new calendar event, Drive file change, …).
Fields: integration_type (e.g. "googlecalendar", "googledrive"), events (array of event names), function_name. Provider payloads/auth differ — read the provider's own webhook documentation for payload and auth before editing the handler (`list_connectors` gives the integration type, scopes and connection state, not a handler guide).

Optional trigger_conditions pre-filter webhook events: {"logic": "and", "conditions": [{"field": "<dot.path>", "operator": "<op>", "value": "<target>"}]}
- field: dot-path into the provider's raw webhook payload — no "data." prefix (unlike entity conditions); Slack: "event.channel", "event.text", "event.user". Take paths from the provider's public webhook payload docs.
- operator: equals | not_equals | gt | gte | lt | lte | contains | not_contains | starts_with | ends_with | in_list | not_in_list | exists | not_exists | is_empty | is_not_empty
- value: concrete value. If the user gives a human-readable name but the payload carries an internal ID, resolve it first: temporary backend function using the authorized connector, invoke it, use the returned ID — never guess IDs. E.g. #general Slack: conversations.list → {"field": "event.channel", "operator": "equals", "value": "C0123ABC"}.
</connector_automations>

<usage_guidelines>
- Existing automations and their IDs: the dashboard (Automations).
- Pause/resume from the dashboard.
</usage_guidelines>
</automations_capability>
