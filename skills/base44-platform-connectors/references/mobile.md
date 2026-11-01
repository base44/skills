<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 connectors: App connectors (mobile apps)

<app_connectors>
App connectors allow you to integrate with external services in an easy way using OAuth.
App connectors come in the following types:

<connector_types>
1. **Shared connector**: The app builder connects their own account. All app users share the app builder's single connection. Backend functions call the external API on the app builder's behalf. See <connector_workflow_rules>.
2. **App user connector**: The app builder provides their OAuth app credentials (client ID, client secret). Each App User connects their own account individually. Backend functions call the external API on the app user's behalf using the app user's tokens. See <app_user_connectors>.
3. **BYO shared connector**: A workspace admin registers their own OAuth app (an `OrganizationConnector`). The app builder consents once against it; the resulting token is shared across all app users. Use when the platform doesn't have its own OAuth app for the integration (e.g., Snowflake, Databricks) or when the workspace wants to use its own OAuth app. See <byo_shared_connectors>.
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
3. Write connector-backed code only once the connector is authorized, and read its token in server code by connection mode: shared → `base44.asServiceRole.connectors.getConnection(integration_type)`; BYO shared → `base44.asServiceRole.connectors.getWorkspaceConnection(connectorId)` (see <byo_shared_connectors>); app user → `base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId)` for the signed-in app user, after the frontend let them consent with `connectAppUser(connectorId)` (see <app_user_connectors>). Never serve one app user's data through the shared account's token. Then make the API calls yourself.
</connector_workflow_rules>
</app_connectors>

<byo_shared_connectors>
A workspace-registered OAuth app (an `OrganizationConnector`) that the app builder consents once against. The resulting token is shared across all app users — same semantics as a SHARED connector, but the OAuth credentials come from the workspace admin (not the platform) and so the connection is keyed by `connectorId` rather than `integration_type`.

**Prerequisite — the workspace connector must already exist.** A workspace admin registers it in workspace settings → Connectors ("Manage connectors" for users on the new integrations view) with the OAuth client_id, client_secret and any integration-specific config such as a Snowflake subdomain; its `id` is the `connectorId` below. If none exists for the integration the user needs, tell the user to have their admin register one, then retry.

The app builder consents once against the connector from the Base44 builder chat (ask it to connect the workspace connector); the MCP `initiate_connector_connection` tool connects platform-shared connectors by integration type only.

**No frontend code is generated for this mode** — consent is a one-time build-time action, not a runtime action in the published app. Unlike APP_USER, there is no `connectAppUser` call.

**Backend function — use `getWorkspaceConnection(connectorId)`:**

```
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // connectorId is the workspace connector's id, e.g. "abc123"
    const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getWorkspaceConnection("abc123");

    // connectionConfig carries any admin-configured parameters such as
    // subdomain, workspace URL, etc. Consult the integration's usage guide
    // for the exact field name.
    const apiUrl = `https://${connectionConfig.subdomain}.snowflakecomputing.com/api/v2/statements`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ statement: "SELECT COUNT(*) FROM my_table" }),
    });
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

Differences from SHARED code-gen:
- A dedicated `getWorkspaceConnection(connectorId)` method is called with the connector's `id` as a string — NOT `getConnection`, which is reserved for platform-shared connectors keyed by `"<integration_type>"`.
- `connectionConfig` is sourced from the workspace admin's `OrganizationConnector`, not per-app — so whatever the admin configured at registration time is what you get at runtime.
</byo_shared_connectors>

<app_user_connectors>
App-user connectors are registered per workspace (workspace settings → Connectors); each has an `id`, the `connectorId` below. If one is already registered for that integration type, use its `id` — do not register another. Register a second connector of the same type only when the user asks for a separate one (a different account or OAuth app); when that is unclear, ask which they want instead of registering.

When none is registered yet, the user registers one there with the integration type, a name no existing connector uses, a description and the minimal scopes the request needs — suggest those from the provider's OAuth documentation.

When implementing app-user connector functionality:
1. **Connector**: Use the connector already registered for that integration type; the user registers a new one only when none exists.
2. **Backend function**: Reuse an existing backend function when it already provides the requested connector-backed behavior. If no suitable function exists, create or edit one that uses `base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId)` to get the *current app user's* connection (access token + connection config) and call the external API.
3. **Frontend**: Generate the connect/disconnect UI and data fetching, following the three rules in `<app_user_connector_frontend_rules>`. Use the connector's `id` as the `connectorId`.
4. **In-app agents**: If a specific agent should use this functionality, add the backend function to its `tool_configs`. Give it app-user connector permission only when it should help app users connect or reconnect that account: in the agent's config, `app_user_connector_configs` takes the exact connector `id` as `connector_id`; do not pass the integration type or connector name.

<app_user_connector_sdk>
**APP_USER mode** — requires BOTH frontend code (to let each app user consent) AND a backend function (to use the current app user's token).

All APP_USER SDK methods are keyed on **connectorId** (the connector's `id` in the dashboard) — NOT the integration type.

**SDK methods:**

| Connector mode | Frontend | Backend function |
|---|---|---|
| SHARED | None (no frontend SDK) | `base44.asServiceRole.connectors.getConnection(type)` |
| BYO_SHARED | None (no frontend SDK — consent is at build time) | `base44.asServiceRole.connectors.getWorkspaceConnection(connectorId)` |
| APP_USER | `base44.connectors.connectAppUser(connectorId)`, `base44.connectors.disconnectAppUser(connectorId)` | `base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId)` |

- `connectAppUser(connectorId)` — returns a URL string. Open it so the app user can complete OAuth consent.
- `disconnectAppUser(connectorId)` — revokes the OAuth connection server-side, returns nothing.
- `getCurrentAppUserConnection(connectorId)` — returns a connection object `{ accessToken, connectionConfig }` for the **app user's** OAuth connection (not the builder's). Destructure `accessToken` and optionally `connectionConfig` (e.g. `const { accessToken, connectionConfig } = await ...getCurrentAppUserConnection(connectorId)`). `connectionConfig` may contain connector-specific parameters (e.g. subdomain, workspace URL) — only use it when the connector's usage guide says to.

**Backend function example:**

```
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // connectorId is the registered connector's id, e.g. "abc123"
    const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    return Response.json({ events: data.items || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```
</app_user_connector_sdk>

<app_user_connector_frontend_rules>
**Three rules you MUST follow when generating frontend code that uses app user connectors. Design the page UI however fits the app — but always apply these rules:**

**Rule 1 — Auth gate:** `connectAppUser()` will fail if the app user is not signed in. Use `base44.auth.isAuthenticated()` to check before rendering any connector UI (Connect button, data that depends on the connector). If not authenticated, show a login button that calls `base44.auth.redirectToLogin()`.

**Rule 2 — Connection status via data fetch:** There is no separate "check connection" API. Instead, call the backend function that uses the connector on page load inside a try/catch. If it succeeds → user is connected (and you already have the data). If it throws → user is not connected, show the Connect button. Extract this fetch as a reusable function — you will call it again in Rule 3.

**Rule 3 — Auto-refresh after OAuth:** The OAuth flow opens in a new tab. When the user finishes and the tab closes, the original page doesn't know. To fix this: use `window.open()` to keep a reference to the popup, then poll `popup.closed` — when it closes, call the reusable fetch from Rule 2 to refresh data automatically.

**How the three rules connect (hooks/handlers skeleton):**
```
const [user, setUser] = useState(null);
const [data, setData] = useState(null);
const [connected, setConnected] = useState(false);
const [loading, setLoading] = useState(true);

// Rule 2: reusable fetch — doubles as connection check AND data loader
const fetchData = async () => {
  try {
    const res = await base44.functions.invoke("myBackendFunction", {});
    setData(res.data);
    setConnected(true);
  } catch {
    setConnected(false);
  }
};

// Rule 1+2: check auth first, then fetch to detect connection status
useEffect(() => {
  base44.auth.isAuthenticated().then(async (authed) => {
    if (authed) {
      const me = await base44.auth.me();
      setUser(me);
      await fetchData();
    }
    setLoading(false);
  });
}, []);

// Rule 3: open OAuth popup, poll for close, then re-fetch
const handleConnect = async () => {
  const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
  const popup = window.open(url, "_blank");
  const timer = setInterval(() => {
    if (!popup || popup.closed) {
      clearInterval(timer);
      fetchData();
    }
  }, 500);
};

const handleDisconnect = async () => {
  await base44.connectors.disconnectAppUser(CONNECTOR_ID);
  setConnected(false);
  setData(null);
};

// Then in your JSX, use loading, user, and connected to decide what to render.
// If !user, show a login button that calls base44.auth.redirectToLogin().
// Design the UI however fits the app.
```
</app_user_connector_frontend_rules>
</app_user_connectors>
