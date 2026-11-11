# Base44 SDK Quick Reference

Compact method signatures for all SDK modules. **Verify against this before writing code.**

---

## Auth (`base44.auth.*`)

```
loginViaEmailPassword(email, password, turnstileToken?) → Promise<{access_token, user}>
loginWithProvider('google' | 'microsoft' | 'facebook' | 'apple' | 'sso', fromUrl?) → void
me() → Promise<User | null>
updateMe(data) → Promise<User>               // Record<string, any>; id/email/full_name/created_by/collaborator_role immutable; role needs editor access
isAuthenticated() → Promise<boolean>
hasToken() → boolean                         // token present on client, not verified; true even if expired
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

---

## Entities (`base44.entities.EntityName.*`)

```
create(data) → Promise<T>
bulkCreate(dataArray) → Promise<T[]>                           // not a transaction
list(sort?, limit?, skip?, fields?) → Promise<Pick<T, K>[]>    // legacy array form, max 5,000
list({sort?, limit?, cursor?, fields?}) → Promise<EntityPage<Pick<T, K>>>       // cursor form, default 100, max 5,000
list({distinct, limit?, cursor?}) → Promise<EntityPage<T[K]>>  // distinct values, default 100, max 1,000
filter(query, sort?, limit?, skip?, fields?) → Promise<Pick<T, K>[]>  // legacy array form
filter(query, {sort?, limit?, cursor?, fields?}) → Promise<EntityPage<Pick<T, K>>>  // cursor form
get(id) → Promise<T>
update(id, data) → Promise<T>
updateMany(query, mongoUpdateOp) → Promise<UpdateManyResult>   // $set/$rename/$unset/$inc/$mul/$min/$max/$currentDate/$addToSet/$push/$pull; batched 500/call, check has_more
bulkUpdate(dataArray) → Promise<T[]>                           // each item must have id; up to 500; not a transaction
count(query?) → Promise<number>
aggregate({query?, groupBy?, dateBucket?, count?, sum?, avg?, min?, max?, countDistinct?, having?, sort?, limit?}) → Promise<{rows, truncated}>
upsert(records, {key}) → Promise<{created, updated, records}>  // up to 500; not a transaction
delete(id) → Promise<DeleteResult>                             // moves to trash, restorable
deleteMany(query) → Promise<DeleteManyResult>                  // moves to trash; not a transaction
importEntities(file) → Promise<ImportResult<T>>                // frontend only
subscribe(callback) → () => void                               // returns unsubscribe fn
```

**Sort:** Use `SortField<T>`: `-fieldName` for descending (e.g., `-created_date`). Legacy `list`/`filter` max 5,000 per request.

**Query operators** (`filter`/`count`/`deleteMany`/`updateMany`/`aggregate`'s `query`): `$eq $ne $gt $gte $lt $lte $in $nin $exists` (any field), `$regex` (string), `$all $size` (array), `$not` (negate), `$and $or $nor` (root-level combinators). A plain array value means "any of".

---

## Functions (`base44.functions.*`)

```
invoke(functionName, data?) → Promise<AxiosResponse>  // your JSON is on .data; throws on non-2xx (err.response.data)
fetch(path, init?) → Promise<Response>   // low-level, for streaming/custom methods
```

**Backend:** Use `base44.asServiceRole.functions.invoke()` for admin access.

---

## Integrations (`base44.integrations.Core.*`)

```
InvokeLLM({prompt, model?, add_context_from_internet?, response_json_schema?, file_urls?}) → Promise<string | object>
GenerateImage({prompt, existing_image_urls?}) → Promise<{url}>   // existing_image_urls: edit/reference existing images
GenerateSpeech({text, voice?, language_code?}) → Promise<{url}>   // stored MP3; voices river (default), honey, sunny, storm, spark; ≤5,000 chars
SendEmail({to, subject, body?, html?, text?, from_name?, attachments?}) → Promise<any>  // set at least one of body/html/text; attachments: up to 5 files, 5MB each/10MB total
UploadFile({file}) → Promise<{file_url}>
UploadPrivateFile({file}) → Promise<{file_uri}>
CreateFileSignedUrl({file_uri, expires_in?}) → Promise<{signed_url}>
ExtractDataFromUploadedFile({file_url, json_schema}) → Promise<object>
```

Also available as `base44.asServiceRole.integrations.*` with elevated permissions.

**AI surface:** single call, no tools → `InvokeLLM`; chat product for users → `base44.agents`; task-with-tools agent (code) → `aiGateway`; one default image → `GenerateImage`; simple text-to-video → `GenerateVideo`; multiple/configured/edited images or advanced video → `aiGateway`; text-to-speech → [browser/Core/gateway selection](ai-gateway.md#generate-speech); classify/score/route → `aiGateway` Jev (see below).

### AI Gateway (`base44.asServiceRole.aiGateway.*`)

```
asServiceRole.aiGateway.connection({ provider?: "openai" | "typesafe" }) → { baseURL, token, headers }   // backend only; always pass headers
aiGateway.connection(options?) → same, caller's token — browser/user-token calls get 403 ai_gateway_requires_service_role (private/workspace apps excepted)
```

- `openai` (default): chat completions for **code agents** (model `automatic` by default), `images.generate` / `images.edit`, async `videos.create` / `videos.retrieve` (specific model required), and `audio.speech.create` (completed audio bytes; see [speech guide](ai-gateway.md#generate-speech)).
- `typesafe`: `experimental_evaluate` (`ai` 7.0.105+) with `typesafe.evaluationModel("jev")` for classify/score/route decisions.
- Set `maxRetries: 0` on image, video, speech, and evaluation calls. See [ai-gateway.md](ai-gateway.md).

### Custom Integrations (`base44.integrations.custom.*`)

```
call(slug, operationId, {payload?, pathParams?, queryParams?}?) → Promise<{success, status_code, data}>
```

**operationId format:** `"method:/path"` (e.g., `"get:/contacts"`, `"post:/users/{id}"`)

---

## Payments (`base44.payments.*`)

```
preloadCheckout('paypal' | 'stripe') → Promise<void>                                   # never rejects; call early
mountCheckout(element, checkout, {onComplete?, onCancel?, onError?}?) → Promise<CheckoutMount>   # browser only
completeCheckout(checkoutId) → Promise<{checkout_id, status: 'paid'|'pending'}>         # PayPal only
listPurchases({checkout_id?, subscription_id?, limit?, cursor?}?) → Promise<{items, next_cursor}>  # current user only
```

**Backend (`base44.asServiceRole.payments.*`)** — only place checkouts can be created:
```
createCheckout({items, currency?, success_path, cancel_path?, buyer?, metadata?, idempotency_key?, presentation?, shipping?}) → Promise<CreateCheckoutResult>
listPurchases({..., buyer_email?}?) → Promise<ListPurchasesResult>    # any buyer, includes metadata
refund({payment_id, amount, idempotency_key}) → Promise<RefundResult>
cancelSubscription(subscriptionId, {at_period_end?}?) / pauseSubscription(subscriptionId) / resumeSubscription(subscriptionId) → Promise<SubscriptionResult>
```

One provider per app: Stripe (redirect+embedded, refunds, cancel now/period-end, pause/resume) | PayPal (embedded only, refunds, cancel now only, pause/resume) | Base44 Payments/Wix (redirect only, no refunds/subscription actions). See [payments.md](payments.md).

---

## Voice (`base44.asServiceRole.voice.*`)

**Backend only, beta.**

```
createSession({sdp, mcpProfileId, voiceInstructions, agentInstructions, voiceModel?, agentModel?, voice?, initialMessages?}) → Promise<{sessionId, sdp, expiresAt, environment}>
endSession(sessionId) → Promise<void>
```

Browser creates a WebRTC SDP offer and posts it to a backend function; `createSession()` returns the SDP answer. Audio flows directly between browser and model — your backend never touches it. See [voice.md](voice.md).

---

## Browser (`base44.asServiceRole.browser.*`)

**Backend only.**

```
getSession({captureDebugArtifacts?, sessionTimeoutSeconds?}?) → Promise<BrowserSession>   // BrowserSession has end()
endSession(sessionId) → Promise<void>
```

Remote CDP browser session for Playwright/Puppeteer automation. Billed by the minute; always call `end()`/`endSession()`. See [browser.md](browser.md).

---

## App (`base44.app.*`)

```
getPublicSettings() → Promise<{id, public_settings}>   // public_settings: app visibility; any auth mode
```

Throws (403) with `data.extra_data.reason` of `auth_required` or `user_not_registered` when the visitor can't access the app. See [app.md](app.md).

---

## User Connectors (`base44.connectors.*`)

Frontend, per-app-user OAuth (keyed by connector ID, not integration type):
```
connectAppUser(connectorId) → Promise<string>      // redirect URL to start OAuth
disconnectAppUser(connectorId) → Promise<void>
```

Retrieve the resulting per-user token from a backend function with `asServiceRole.connectors.getCurrentAppUserConnection(connectorId)`.

---

## Analytics (`base44.analytics.*`)

```
track({eventName, properties?}) → void
```

---

## App Logs (`base44.appLogs.*`)

```
logUserInApp(pageName) → Promise<void>
fetchLogs(params?) → Promise<any>
getStats(params?) → Promise<any>
```

---

## Users (`base44.users.*`)

```
inviteUser(userEmail, role) → Promise<any>    // role: 'user' | 'admin'
```

---

## Service Role Connectors (`base44.asServiceRole.connectors.*`)

**Backend only, service role required.**

```
getConnection(integrationType) → Promise<{accessToken, connectionConfig}>              // shared/platform connector, by integration type
getWorkspaceConnection(connectorId) → Promise<{accessToken, connectionConfig}>          // shared, workspace-registered connector (e.g. Databricks, Snowflake), by connector ID
getCurrentAppUserConnection(connectorId) → Promise<{accessToken, connectionConfig}>     // per-app-user token, by connector ID; needs createClientFromRequest
callApi(integrationType, {method?, host?, path, query?, headers?, body?}) → Promise<{success, phase, status, data, dataBase64, contentType, headers, creditsCharged}>  // metered connectors
getAccessToken(integrationType) → Promise<string>                           // deprecated, use getConnection
```

**Types:** Run `npx base44 connectors list-available` to see all available integration types. See [connectors.md](connectors.md).

---

## SSO (`base44.asServiceRole.sso.*`)

**Backend only, service role required.**

```
getAccessToken(userId) → Promise<{access_token}>
getIdToken(userId)     → Promise<string>             // raw ID token; use for identity claims, especially email
```

`getIdToken` returns the current app user's OIDC ID token as a raw string, and the service-role client must act on behalf of the same user.

---

## Service Role Access

**Backend functions only.** Prefix any module with `asServiceRole` for admin access:

```javascript
base44.asServiceRole.entities.Task.list()
base44.asServiceRole.functions.invoke('name', data)
base44.asServiceRole.connectors.getConnection('slack')
base44.asServiceRole.sso.getAccessToken(userId)
base44.asServiceRole.sso.getIdToken(userId) // current app user only; use for the email claim
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
