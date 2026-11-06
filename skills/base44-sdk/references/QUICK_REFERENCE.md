# Base44 SDK Quick Reference

Compact method signatures for all SDK modules. **Verify against this before writing code.**

---

## Auth (`base44.auth.*`)

```
loginViaEmailPassword(email, password, turnstileToken?) → Promise<{access_token, user}>
loginWithProvider('google' | 'microsoft' | 'facebook' | 'apple' | 'sso', fromUrl?) → void
me() → Promise<User | null>
updateMe(data) → Promise<User>                 // data: Record<string, any>; id/email/full_name/created_date/updated_date/created_by/collaborator_role are protected
isAuthenticated() → Promise<boolean>
hasToken() → boolean                            // sync, no network call; true even if the token is expired/revoked
logout(redirectUrl?) → void
redirectToLogin(nextUrl) → void              # ⚠️ Avoid - prefer custom login UI
register({email, password, turnstile_token?, referral_code?}) → Promise<any>
verifyOtp({email, otpCode}) → Promise<any>
resendOtp(email) → Promise<any>
inviteUser(userEmail, role) → Promise<any>
resetPasswordRequest(email) → Promise<any>
resetPassword({resetToken, newPassword}) → Promise<any>
changePassword({userId, currentPassword, newPassword}) → Promise<any>
setToken(token, saveToStorage?) → void
```

`'apple'` and `'sso'` must be enabled in app settings first; `'sso'` authenticates against whichever enterprise SSO connection is configured, not a specific IdP. Inside an iframe, `loginWithProvider()` uses a popup + `postMessage` handoff instead of a full-page redirect.

---

## Entities (`base44.entities.EntityName.*`)

```
create(data) → Promise<T>
bulkCreate(dataArray) → Promise<T[]>                           // not a transaction
list(sort?, limit?, skip?, fields?) → Promise<Pick<T, K>[]>    // legacy array form, max 5,000/request
list(options) → Promise<EntityPage<Pick<T, K>>>                // cursor-page form (preferred): { sort?, limit?, cursor?, fields? }
list({ distinct, limit?, cursor? }) → Promise<EntityPage<T[K]>> // distinct values of one field, max 1,000/page
filter(query, sort?, limit?, skip?, fields?) → Promise<Pick<T, K>[]>
filter(query, options) → Promise<EntityPage<Pick<T, K>>>
filter(query, { distinct, ... }) → Promise<EntityPage<T[K]>>
get(id) → Promise<T>
count(query?) → Promise<number>
aggregate(spec) → Promise<EntityAggregateResult>                // group-by: count/sum/avg/min/max/countDistinct/dateBucket/having; max 1,000 rows
update(id, data) → Promise<T>
updateMany(query, mongoUpdateOp) → Promise<UpdateManyResult>   // e.g. { $set: { field: val } }; batched by 500, check result.has_more
bulkUpdate(dataArray) → Promise<T[]>                           // each item must have id; max 500 per request
upsert(records, { key }) → Promise<EntityUpsertResult<T>>      // create-or-update by a natural key instead of id; max 500 per call
delete(id) → Promise<DeleteResult>                             // moves to trash
deleteMany(query) → Promise<DeleteManyResult>                  // moves to trash, not a transaction
importEntities(file) → Promise<ImportResult<T>>                // frontend only
subscribe(callback) → () => void                               // returns unsubscribe fn; oversize (>10KB) fields slim with data._oversize
```

**Sort:** Use `SortField<T>`: `-fieldName` for descending (e.g., `-created_date`). Max 5,000 per request for list/filter.

**Query operators** (`filter`, `count`, `updateMany`, `deleteMany`, `aggregate.query`): `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`, `$regex` (string), `$all`/`$size` (array), `$not`; root-level `$and`/`$or`/`$nor`.

---

## Functions (`base44.functions.*`)

```
invoke(functionName, data?) → Promise<AxiosResponse>  // data must be an object/FormData (not a string); your JSON is on .data; throws on non-2xx (err.response.data)
fetch(path, init?) → Promise<Response>   // low-level, for streaming/custom methods; leading slash on path is optional; auth headers merged in automatically (init.headers overrides per-key)
```

**Backend:** Use `base44.asServiceRole.functions.invoke()` for admin access.

---

## Agents (`base44.agents.*`)

Requires a logged-in user.

```
createConversation({agent_name, metadata?}) → Promise<Conversation>
getConversations() → Promise<Conversation[]>
getConversation(id) → Promise<Conversation>                        // full data, incl. untruncated tool calls
listConversations({q?, sort?, limit?, skip?, fields?}) → Promise<Conversation[]>
subscribeToConversation(id, onUpdate?) → () => void                 // realtime; tool call data truncated
addMessage(conversation, message) → Promise<Message>
getWhatsAppConnectURL(agentName) → string
getTelegramConnectURL(agentName) → string
```

Tool-call status is one of `running | success | error | stopped | waiting_for_user_input`.

---

## Actors (`base44.actors.*`)

Realtime WebSocket rooms — multiplayer, presence, in-room chat. See [actors.md](actors.md).

```
base44.actors.<ActorName>(instanceId) → ActorRef          // <ActorName> is a property, not a string arg
actorRef.connect(options?) → Connection                   // options.id: stable connection id for reconnects
connection.subscribe(callback) → ActorSubscription         // { unsubscribe() } — differs from entities.subscribe()!
connection.send(data) → void
connection.close() → void
connection.id                                              // the id the actor sees as conn.id
```

`conn` (server side) carries **no verified user identity** — only `conn.id`, which is a client-chosen, unverified value. `this.client` inside an actor is always anonymous (RLS-gated like a logged-out visitor); there is no service-role escalation available inside an actor.

---

## Integrations (`base44.integrations.Core.*`)

```
InvokeLLM({prompt, model?, add_context_from_internet?, response_json_schema?, file_urls?}) → Promise<string | object>  // file_urls and add_context_from_internet are mutually exclusive
GenerateImage({prompt, existing_image_urls?}) → Promise<{url}>   // output always PNG, ~1024px shorter side
GenerateSpeech({text, voice?, language_code?}) → Promise<{url}>   // stored MP3; voices river (default), honey, sunny, storm, spark; ≤5,000 chars
SendEmail({to, subject, body, from_name?}) → Promise<any>
UploadFile({file}) → Promise<{file_url}>
UploadPrivateFile({file}) → Promise<{file_uri}>
CreateFileSignedUrl({file_uri, expires_in?}) → Promise<{signed_url}>
ExtractDataFromUploadedFile({file_url, json_schema}) → Promise<object>
```

**AI surface:** single call, no tools → `InvokeLLM`; chat product for users → `base44.agents`; task-with-tools agent (code) → `aiGateway`; one default image → `GenerateImage`; simple text-to-video → `GenerateVideo`; multiple/configured/edited images or advanced video → `aiGateway`; text-to-speech → [browser/Core/gateway selection](ai-gateway.md#generate-speech); classify/score/route → `aiGateway` Jev (see below).

`base44.integrations` runs as the current user (or anonymous); `base44.asServiceRole.integrations` runs with service-role permissions.

### AI Gateway (`base44.asServiceRole.aiGateway.*`)

```
asServiceRole.aiGateway.connection({ provider?: "openai" | "typesafe" }) → { baseURL, token, headers }   // backend only; always pass headers
aiGateway.connection(options?) → same, caller's token — browser/user-token calls get 403 ai_gateway_requires_service_role (private/workspace apps excepted)
```

- `openai` (default): chat completions for **code agents** (model `automatic` by default, or pin one such as `claude_sonnet_4_6`, `gpt_5_5`, `gemini_3_1_pro`), `images.generate` / `images.edit`, async `videos.create` / `videos.retrieve` (specific model required), and `audio.speech.create` (completed audio bytes; see [speech guide](ai-gateway.md#generate-speech)).
- `typesafe`: `experimental_evaluate` (`ai` 7.0.105+) with `typesafe.evaluationModel("jev")` for classify/score/route decisions.
- Set `maxRetries: 0` on image, video, speech, and evaluation calls. See [ai-gateway.md](ai-gateway.md).

### Custom Integrations (`base44.integrations.custom.*`)

```
call(slug, operationId, {payload?, pathParams?, queryParams?}?) → Promise<{success, status_code, data}>
```

**operationId format:** `"method:/path"` (e.g., `"get:/contacts"`, `"post:/users/{id}"`)

Throws a plain `Error` for a missing/empty `slug`/`operationId`; throws a `Base44Error` (404/502/504) for not-found/external-failure/timeout. A non-2xx from the external API itself resolves normally with `success: false` rather than throwing.

---

## Analytics (`base44.analytics.*`)

```
track({eventName, properties?}) → void
```

Automatic init events also capture marketing attribution (`utm_*`, `gclid`, `fbclid`, etc.) and referrer. Both automatic tracking and `track()` respect the app's analytics consent/opt-out setting (off / consent-required / on) — silently no-ops when consent isn't granted.

---

## App Logs (`base44.appLogs.*`)

```
logUserInApp(pageName) → Promise<void>
```

Feeds the same consent-gated App Analytics pipeline as `analytics` — silently no-ops without analytics consent. `fetchLogs()`/`getStats()` exist in the SDK but are `@internal`, not part of the public API.

---

## Users (`base44.users.*`)

```
inviteUser(userEmail, role) → Promise<any>    // role: 'user' | 'admin'
```

Not a strict equivalent of `base44.auth.inviteUser()`, which hits a different endpoint and accepts any app-defined role string.

---

## App (`base44.app.*`)

Available in any authentication mode.

```
getPublicSettings() → Promise<{ id, public_settings }>   // public_settings: app visibility
```

Rejects with a 403 `Base44Error` when the visitor can't access the app — check `data.extra_data.reason`: `auth_required` or `user_not_registered`.

---

## Payments (`base44.payments.*` / `base44.asServiceRole.payments.*`)

See [payments.md](payments.md) for the full providers table, error codes, and types.

```
// base44.payments — anonymous/user auth, frontend
preloadCheckout(provider: 'paypal' | 'stripe') → Promise<void>
mountCheckout(element, checkout, options?) → Promise<CheckoutMount>   // browser only
completeCheckout(checkoutId) → Promise<CompleteCheckoutResult>
listPurchases(params?) → Promise<ListPurchasesResult>                 // current user's own purchases

// base44.asServiceRole.payments — service role, backend only
createCheckout(params) → Promise<CreateCheckoutResult>
completeCheckout(checkoutId) → Promise<CompleteCheckoutResult>
listPurchases(params?) → Promise<ListPurchasesResult>                 // any buyer, incl. metadata/shipping_address
refund({payment_id, amount, idempotency_key}) → Promise<RefundResult>
cancelSubscription(subscriptionId, options?) → Promise<SubscriptionResult>
pauseSubscription(subscriptionId) → Promise<SubscriptionResult>
resumeSubscription(subscriptionId) → Promise<SubscriptionResult>
```

**Never grant access from a frontend `mountCheckout()` callback alone** — confirm with `asServiceRole.payments.listPurchases()` on the backend first.

---

## Service Role Connectors (`base44.asServiceRole.connectors.*`)

**Backend only, service role required.**

```
getConnection(integrationType) → Promise<{accessToken, connectionConfig}>            // shared, by integration type (recommended)
getWorkspaceConnection(connectorId) → Promise<{accessToken, connectionConfig}>       // shared, by workspace connector ID (e.g. Databricks, Snowflake)
getCurrentAppUserConnection(connectorId) → Promise<{accessToken, connectionConfig}>  // per-user; needs createClientFromRequest(req)
callApi(integrationType, request) → Promise<{status, headers, data}>                 // metered connectors only (e.g. 'x'); no token handling needed
getAccessToken(integrationType) → Promise<string>                                    // deprecated
```

**Types:** Run `npx base44 connectors list-available` to see all available integration types.

## App User Connectors (`base44.connectors.*`)

**Frontend.** Per-user OAuth flow (each app user connects their own account).

```
connectAppUser(connectorId) → Promise<string>   // redirect URL; window.location.href = url
disconnectAppUser(connectorId) → Promise<void>
```

---

## SSO (`base44.asServiceRole.sso.*`)

**Backend only, service role required.**

```
getAccessToken(userId) → Promise<{access_token}>
getIdToken(userId)     → Promise<string>             // raw ID token; use for identity claims, especially email
```

`getIdToken` returns the current app user's OIDC ID token as a raw string, and the service-role client must act on behalf of the same user.

---

## Browser (`base44.asServiceRole.browser.*`)

**Backend only, service role required.** Remote CDP browser sessions for Playwright/Puppeteer automation. See [browser.md](browser.md).

```
getSession(options?) → Promise<BrowserSession>   // { sessionId, connectionUrl, connectionScope, end() }; options: { captureDebugArtifacts?, sessionTimeoutSeconds? }
endSession(sessionId) → Promise<void>            // end a session created in a different request
```

`connectionUrl` is a CDP WebSocket URL — treat it as a credential, never log it or send it to the frontend.

---

## Service Role Access

**Backend functions only.** Prefix any module with `asServiceRole` for admin access:

```javascript
base44.asServiceRole.entities.Task.list()
base44.asServiceRole.functions.invoke('name', data)
base44.asServiceRole.connectors.getConnection('slack')
base44.asServiceRole.sso.getAccessToken(userId)
base44.asServiceRole.sso.getIdToken(userId) // current app user only; use for the email claim
base44.asServiceRole.payments.createCheckout({ ... })
base44.asServiceRole.browser.getSession()
```

---

## Backend Function Template

```javascript
import { createClientFromRequest } from "@base44/sdk";

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const data = await req.json();
  
  // User context
  const user = await base44.auth.me();
  
  // Service role for admin operations
  const allRecords = await base44.asServiceRole.entities.Task.list();
  
  return Response.json({ success: true });
}
```

---

## Client Initialization (External Apps)

```javascript
import { createClient } from "@base44/sdk";

const base44 = createClient({ appId: "your-app-id" });  // MUST use 'appId'
```

---

## TypeScript type registries

For typed entities, function names, and agent names (autocomplete and type checking), the Base44 CLI generates types and wires them into your project. Use the **base44-cli** skill for how to generate types.
