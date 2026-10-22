<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 connectors: App connectors (TanStack Start)

<app_connectors>
App connectors integrate the app with external services via OAuth.

<connector_types>
1. Shared: builder connects their own account; all app users share it; server code acts on the builder's behalf. See <shared_connectors>.
2. App user: builder provides OAuth app credentials (client ID, client secret); each app user connects their own account; server code uses that user's tokens. See <app_user_connectors>.
3. BYO shared: workspace admin registers their own OAuth app (`OrganizationConnector`); builder consents once; token shared across all app users. For services with no platform OAuth app (e.g., Snowflake, Databricks) or when the workspace wants its own. See <byo_shared_connectors>.
</connector_types>

<connector_decision_flow>
Connecting a connector happens outside the code: read the catalog and each connector's details (description, scopes, auth status, connection mode) with the Base44 MCP `list_connectors` tool or `base44 connectors list-available --app-id <APP_ID>`; connect or re-scope a shared connector with `initiate_connector_connection` / `base44 connectors initiate` passing the complete scope set (it replaces, never merges), and let the user finish OAuth in their browser. App-user and BYO-shared connectors are registered by a workspace admin in Settings → OAuth Connectors.
</connector_decision_flow>

<supported_connectors>
The catalog is live: list it with `list_connectors` (MCP) or `base44 connectors list-available`; each entry gives the display name and its `integration_type`.
</supported_connectors>

Use the connector's integration_type for getConnection.
Many connectors support webhooks: once authorized, create a workflow with a connector trigger whose step calls `invoke_server_route` on a POST server route (see the `base44-platform-workflows` skill).

<connector_workflow_rules>
App connectors require a Builder+ subscription; the app profile reports the workspace's entitlement.

When the user asks to connect or use an external service:
1. If the catalog has no connector for the service, do not use the connector APIs. Integrate with server code with secrets or direct API calls instead.
2. Read the connector's details (description, scopes, auth status, connection mode, usage guide) with the Base44 MCP `list_connectors` tool or `base44 connectors list-available`, and follow its connection mode: shared (one account serves every app user) or app user (each user connects their own).
3. Write connector-backed code only once the connector is authorized; in server code read its token with `base44.asServiceRole.connectors.getConnection(integration_type)` and make the API calls yourself.
</connector_workflow_rules>
</app_connectors>
