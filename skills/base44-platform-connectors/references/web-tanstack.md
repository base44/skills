<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 connectors: App connectors (TanStack Start)

<app_connectors>
App connectors integrate the app with external services via OAuth.

<connector_types>
1. Shared: builder connects their own account; all app users share it; server code acts on the builder's behalf. See <connector_workflow_rules>.
2. App user: builder provides OAuth app credentials (client ID, client secret); each app user connects their own account; server code uses that user's tokens. See <app_user_connectors>.
3. BYO shared: workspace admin registers their own OAuth app (a workspace connector); builder consents once; token shared across all app users. For services with no platform OAuth app (e.g., Snowflake, Databricks) or when the workspace wants its own. See <byo_shared_connectors>.
</connector_types>

<connector_decision_flow>
Connecting a connector happens outside the code: `base44 connectors list-available` lists the catalog, and the Base44 MCP `list_connectors` tool is the one source of each connector's details for this app (description, scopes, auth status, `connector_mode`); connect or re-scope a shared connector with `initiate_connector_connection` / `base44 connectors initiate` passing the complete scope set (it replaces, never merges), and let the user finish OAuth in their browser. App-user and BYO-shared connectors are registered by a workspace admin in Workspace settings → Connectors. Before writing any connector code, read the connector's `connector_mode` from `list_connectors`: `app_user_only` is app-user mode, `shared_only` is shared (connect it with `initiate_connector_connection`), and `byo_shared_only` is shared through a workspace-registered connector (see <byo_shared_connectors>; `initiate_connector_connection` covers platform-shared connectors only) — nothing to ask in those cases. When it allows both (`all` or `byo_shared_and_app_user`), ask the user which connection mode they want — shared (one account you connect serves every app user) or app user (each app user connects their own) — on every new request, even when a connector of that type is already registered or authorized.
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
2. Read the connector's details (description, scopes, auth status, connection mode) with the Base44 MCP `list_connectors` tool (`base44 connectors list-available` lists the catalog only), and follow its connection mode: shared (one account serves every app user) or app user (each user connects their own).
3. Write connector-backed code only once the connector is authorized, and read its token in server code by connection mode: shared → `context.getBase44().asServiceRole.connectors.getConnection(integration_type)`; BYO shared → `context.getBase44().asServiceRole.connectors.getWorkspaceConnection(connectorId)` (see <byo_shared_connectors>); app user → `context.getBase44().asServiceRole.connectors.getCurrentAppUserConnection(connectorId)` for the signed-in app user, after the frontend let them consent with `connectAppUser(connectorId)` (see <app_user_connectors>). Never serve one app user's data through the shared account's token. Then make the API calls yourself.
</connector_workflow_rules>
</app_connectors>

<byo_shared_connectors>
A workspace-registered OAuth app (a workspace connector) that the app builder consents once against. The resulting token is shared across all app users — same semantics as a SHARED connector, but the OAuth credentials come from the workspace admin (not the platform) and so the connection is keyed by `connectorId` rather than `integration_type`.

**Prerequisite — the workspace connector must already exist.** A workspace admin registers it in workspace settings → Connectors with the OAuth client_id, client_secret and any integration-specific config such as a Snowflake subdomain; its `id` is the `connectorId` below. If none exists for the integration the user needs, tell the user to have their admin register one, then retry.

Consent is given once from the Base44 chat assistant in the app's builder: tell the user to open the app in Base44 and ask the assistant to connect the workspace connector; the MCP `initiate_connector_connection` tool connects platform-shared connectors by integration type only.

**No frontend code is generated for this mode** — consent is a one-time build-time action, not a runtime action in the published app. Unlike APP_USER, there is no `connectAppUser` call.

**Server function — use `getWorkspaceConnection(connectorId)`** (`src/lib/server-fns.js`):

```
import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/auth-middleware";

// asServiceRole reaches the workspace's shared account: require a signed-in caller, and check
// this user may see what the query returns before returning it.
export const countRows = createServerFn({ method: "GET" }).middleware([requireUser]).handler(async ({ context }) => {
  // connectorId is the workspace connector's id, e.g. "abc123"
  const { accessToken, connectionConfig } = await context.getBase44().asServiceRole.connectors.getWorkspaceConnection("abc123");

  // connectionConfig carries any admin-configured parameters such as
  // subdomain, workspace URL, etc. `connection_config_fields` from `list_connectors`
  // names the admin-entered ones; providers may add an API host or instance URL.
  const apiUrl = `https://${connectionConfig.subdomain}.snowflakecomputing.com/api/v2/statements`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ statement: "SELECT COUNT(*) FROM my_table" }),
  });
  if (!response.ok) throw new Error(`Snowflake ${response.status}`);
  return await response.json();  // return data, never the token
});
```

Differences from SHARED code-gen:
- A dedicated `getWorkspaceConnection(connectorId)` method is called with the connector's `id` as a string — NOT `getConnection`, which is reserved for platform-shared connectors keyed by `"<integration_type>"`.
- `connectionConfig` is sourced from the workspace admin's connector registration, not per-app — so whatever the admin configured at registration time is what you get at runtime.
</byo_shared_connectors>

<app_user_connectors>
App-user connectors are registered per workspace (workspace settings → Connectors); each has an `id`, the `connectorId` below. If one is already registered for that integration type, use its `id` — do not register another. Register a second connector of the same type only when the user asks for a separate one (a different account or OAuth app); when that is unclear, ask which they want instead of registering.

When none is registered yet, the user registers one there with the integration type, a name no existing connector uses, a description and the minimal scopes the request needs — suggest those from the provider's OAuth documentation.

When implementing app-user connector functionality:
1. **Connector**: Use the connector already registered for that integration type; the user registers a new one only when none exists.
2. **Server function**: Reuse an existing server function when it already provides the requested connector-backed behavior. If none does, add one (`createServerFn` in `src/lib/server-fns.js`) that uses `context.getBase44().asServiceRole.connectors.getCurrentAppUserConnection(connectorId)` to get the *current app user's* connection (access token + connection config) and call the external API. Use a server function, not a server route: the page's call carries the signed-in app user, which is who `getCurrentAppUserConnection` resolves.
3. **Frontend**: Generate the connect/disconnect UI and data fetching, following the three rules in `<app_user_connector_frontend_rules>`. Use the connector's `id` as the `connectorId`.
4. **In-app agents**: Give an agent app-user connector permission only when it should help app users connect or reconnect that account — it gives the agent the connect link, not the provider's API. In the agent's config, `app_user_connector_configs` takes the exact connector `id` as `connector_id`; do not pass the integration type or connector name.

<app_user_connector_sdk>
**APP_USER mode** — requires BOTH frontend code (to let each app user consent) AND a server function (to use the current app user's token).

All APP_USER SDK methods are keyed on **connectorId** (the connector's `id` in the dashboard) — NOT the integration type.

**SDK methods:**

| Connector mode | Frontend | Server code (`context.getBase44()`) |
|---|---|---|
| SHARED | None (no frontend SDK) | `context.getBase44().asServiceRole.connectors.getConnection(type)` |
| BYO_SHARED | None (no frontend SDK — consent is at build time) | `context.getBase44().asServiceRole.connectors.getWorkspaceConnection(connectorId)` |
| APP_USER | `base44.connectors.connectAppUser(connectorId)`, `base44.connectors.disconnectAppUser(connectorId)` | `context.getBase44().asServiceRole.connectors.getCurrentAppUserConnection(connectorId)` |

- `connectAppUser(connectorId)` — returns a URL string. Open it so the app user can complete OAuth consent.
- `disconnectAppUser(connectorId)` — revokes the OAuth connection server-side, returns nothing.
- `getCurrentAppUserConnection(connectorId)` — returns a connection object `{ accessToken, connectionConfig }` for the **app user's** OAuth connection (not the builder's). Destructure `accessToken` and optionally `connectionConfig` (e.g. `const { accessToken, connectionConfig } = await ...getCurrentAppUserConnection(connectorId)`). `connectionConfig` may contain connector-specific parameters (e.g. subdomain, workspace URL) — it holds the admin-entered fields (`connection_config_fields` from `list_connectors` names them) plus any the provider returned at connection time, such as an API host or instance URL — when the provider's API is per-account, take the host from it instead of hardcoding the default.

**Server function example** (`src/lib/server-fns.js`):

```
import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/auth-middleware";

// requireUser rejects anonymous callers with 401: the connection belongs to the signed-in app user.
export const listMyEvents = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    // connectorId is the registered connector's id, e.g. "abc123"
    const connection = await context.getBase44().asServiceRole.connectors
      .getCurrentAppUserConnection(connectorId)
      .catch((error) => {
        if (error?.status === 404) return null;  // this app user has not connected (or has revoked) the account
        throw error;
      });
    if (!connection) return { connected: false };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: { 'Authorization': `Bearer ${connection.accessToken}` }
    });
    if (!response.ok) throw new Error(`Google Calendar ${response.status}`);  // a provider failure, not a disconnect
    const data = await response.json();
    return { connected: true, events: data.items || [] };  // return data, never the token
  });
```
</app_user_connector_sdk>

<app_user_connector_frontend_rules>
**Three rules you MUST follow when generating frontend code that uses app user connectors. Design the page UI however fits the app — but always apply these rules:**

**Rule 1 — Auth gate:** `connectAppUser()` will fail if the app user is not signed in. Use `base44.auth.isAuthenticated()` to check before rendering any connector UI (Connect button, data that depends on the connector). If not authenticated, show a login button that calls `base44.auth.redirectToLogin()`.

**Rule 2 — Connection status via data fetch:** There is no separate "check connection" API. Instead, call the server function that uses the connector on page load. It returns `{ connected: false }` when the app user has not connected the account → show the Connect button; otherwise it returns the data. If it throws, something else failed (the provider errored, the network dropped) → show an error and keep the connection state — never send the user to reconnect for it. Extract this fetch as a reusable function — you will call it again in Rule 3.

**Rule 3 — Auto-refresh after OAuth:** The OAuth flow opens in a new tab. When the user finishes and the tab closes, the original page doesn't know. To fix this: use `window.open()` to keep a reference to the popup, then poll `popup.closed` — when it closes, call the reusable fetch from Rule 2 to refresh data automatically.

**How the three rules connect (hooks/handlers skeleton):**
```
const [user, setUser] = useState(null);
const [data, setData] = useState(null);
const [connected, setConnected] = useState(false);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Rule 2: reusable fetch — doubles as connection check AND data loader
const fetchData = async () => {
  try {
    const res = await listMyEvents();  // the server function, imported from "@/lib/server-fns"
    setConnected(res.connected);
    setData(res.connected ? res : null);
    setError(null);
  } catch (e) {
    setError(e);  // provider or network failure: show it, keep the connection state
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
