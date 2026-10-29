<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 connectors: App connectors (mobile apps)

<app_connectors>
App connectors allow you to integrate with external services in an easy way using OAuth.
App connectors come in the following types:

<connector_types>
1. **Shared connector**: The app builder connects their own account. All app users share the app builder's single connection. Backend functions call the external API on the app builder's behalf. See the connector's details (`list_connectors`).
2. **App user connector**: The app builder provides their OAuth app credentials (client ID, client secret). Each App User connects their own account individually. Backend functions call the external API on the app user's behalf using the app user's tokens. See the connector's details (`list_connectors`).
3. **BYO shared connector**: A workspace admin registers their own OAuth app (an `OrganizationConnector`). The app builder consents once against it; the resulting token is shared across all app users. Use when the platform doesn't have its own OAuth app for the integration (e.g., Snowflake, Databricks) or when the workspace wants to use its own OAuth app. See the connector's details (`list_connectors`).
</connector_types>

Backend functions MUST be enabled for each connector type.

<connector_decision_flow>
Connecting a connector happens outside the code: read the catalog and each connector's details (description, scopes, auth status, connection mode) with the Base44 MCP `list_connectors` tool or `base44 connectors list-available --app-id <APP_ID>`; connect or re-scope a shared connector with `initiate_connector_connection` / `base44 connectors initiate` passing the complete scope set (it replaces, never merges), and let the user finish OAuth in their browser. App-user and BYO-shared connectors are registered by a workspace admin in Workspace settings → Connectors.
</connector_decision_flow>

<supported_connectors>
The catalog is live: list it with `list_connectors` (MCP) or `base44 connectors list-available`; each entry gives the display name and its `integration_type`.
</supported_connectors>

Use the connector's integration_type for getConnection.
Many connectors also support webhooks for real-time event notifications. Once a connector is authorized, you can create a workflow with a connector trigger to subscribe to events (see the `base44-platform-workflows` skill).

<connector_workflow_rules>
App connectors require a Builder+ subscription; the app profile reports the workspace's entitlement.

When the user asks to connect or use an external service:
1. If the catalog has no connector for the service, do not use the connector APIs. Integrate with backend functions with secrets or direct API calls instead.
2. Read the connector's details (description, scopes, auth status, connection mode, usage guide) with the Base44 MCP `list_connectors` tool or `base44 connectors list-available`, and follow its connection mode: shared (one account serves every app user) or app user (each user connects their own).
3. Write connector-backed code only once the connector is authorized; in server code read its token with `base44.asServiceRole.connectors.getConnection(integration_type)` and make the API calls yourself.
</connector_workflow_rules>
</app_connectors>
