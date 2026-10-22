<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 backend functions: Backend functions (Vite SPA)

<overview>
Backend functions: HTTP handlers in `base44/functions/{functionName}/entry.ts`, for external APIs with no built-in integration. Always prefer built-in integrations when they cover the need. Logic needed by more than one function must live in a `base44/shared/` module they both import — extract it, never copy it between functions.
</overview>

The Core-integration routing rule is an exception: use a backend function for Core methods except `UploadPublicFile`, `UploadPrivateFile` and `CreateFileSignedUrl` (`UploadFile` is the retired spelling of `UploadPublicFile`).

<integration_priority>
For external-service integrations, in order:
1. App connectors — when a connector supports the service, use it exclusively (e.g. Google Calendar via its connector).

2. Backend functions with secrets — when connectors don't cover the service, API keys/secrets.

</integration_priority>

<secrets>
Before writing a function that needs a secret/API key, check it's set — using an unset secret fails. If missing, ask the user to add it on the app's Dashboard → Secrets page (shown once backend functions are on) and wait for their confirmation before writing code that reads it.
Secrets: `import { secrets } from "base44:runtime"` → `secrets.get("NAME")`; pre-populated: BASE44_APP_ID. Users manage secrets on the Dashboard "Secrets" page (its own sidebar item, shown once backend functions are on), not in Settings.
Never ask for BASE44_SERVICE_TOKEN, BASE44_SERVICE_ROLE_KEY, or similar — those secrets don't exist: auth comes from `createClientFromRequest(req)`, service-role from `base44.asServiceRole`.
</secrets>

<structure_and_validation>
Code passes lint validation before deployment.
Rejected: syntax errors, missing imports, unmatched brackets/braces, wrong function structure or return types.
Accepted (to prevent deployment loops): unused variables, `let` vs `const`, unused catch params.

Requirements:
- Handler: `export default async function(req: Request): Promise<Response> { ... }` — the only accepted pattern.
- Return Response objects, not strings/plain objects.
- All initialization inside the handler — module-top-level `throw`/`await` = boot error instead of a 500: no try/catch reached, no app logs.
- try/catch the handler body; return a proper error response.
- `await` every Base44 SDK call — `base44.entities.X.list()`, `base44.auth.me()`, `base44.functions.invoke(...)` all return Promises.
- Validate user auth with `base44.auth.me()` when using the SDK.
- Exception: use `base44.asServiceRole.integrations.Core` for Core-integration functions. Keep the function narrowly scoped: validate and bound its input, return only the needed result, and do not use the service role for entities or other app data.
- Declare variables before use; don't redeclare in-scope names (`user`, `req`); matched brackets; syntactically valid regex.
- Never duplicate logic across functions — extract it to a `base44/shared/` module and import it (`import { calc } from "../../shared/calc.ts"`); own-dir helpers import as `./util.ts`.
- `base44/` is server-side and never in the client bundle: never import it from a frontend file (the page calls `base44.functions.invoke(...)` instead), and never import `src/` or `@/` from a function.
</structure_and_validation>

<coding_guidelines>
For external webhooks, browser GET links and OAuth callbacks, use the server-set `X-Base44-App-Url` origin plus `/functions/<functionName>`. Never expose deployment URLs. Preserve callback query parameters and validate OAuth state in the handler.
- Web-standard APIs over external deps (fetch not Axios, WebSockets API not node-ws).
- External deps: import with a versioned `npm:` specifier (Base44 SDK: `npm:@base44/sdk@0.8.54`); rewrite `esm.sh` / `unpkg.com` URLs to `npm:`.
- JavaScript, not TypeScript. Names camelCase only: no spaces, `/`, hyphens.
- Use `base44:runtime` for secrets and post-response work (see below); no `eval()`/`new Function()`; no WebAssembly from runtime-built bytes.
- Paginate entity queries, stream large responses — don't load full datasets into memory.
- Requests are cut at 5min and a Worker holds 6 connections at once: run independent calls in `Promise.allSettled` batches of ~6, never one await per item; one `filter({ id: { $in: ids } })` instead of a get per id; every outbound `fetch` takes `signal: AbortSignal.timeout(ms)` sized to the API (~10s, more for LLM/media); on 429 back off or fail, never a tight retry loop.
</coding_guidelines>

<post_response_work>
For work to complete after sending a response (analytics pings, non-critical logging): import `waitUntil` from `base44:runtime` and call `waitUntil(myAsyncOp())`. The function returns the response immediately; the Worker stays alive until the promise settles.
```js
import { waitUntil } from "base44:runtime";
export default async function(req) {
  waitUntil(fetch("https://hooks.example.com/ping", { method: "POST" }));
  return Response.json({ ok: true });
}
```
</post_response_work>

<base44_sdk_usage>

```js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { items } = await base44.entities.SampleData.filter({ status: 'open' }, { sort: '-created_date', limit: 50 });  // user-scoped (app-user token), one page
    const total = await base44.asServiceRole.entities.SampleData.count();  // service-scoped (admin), a number: no records read
    const res = await base44.functions.invoke('myFunction', { foo: 'bar' }); // another backend function
    return Response.json({ items, total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

Prefer user-scoped calls (`base44.entities...`) for frontend/user actions. Use `base44.asServiceRole.integrations.Core` for Core-integration functions. For entities, functions, and non-Core integrations, use `base44.asServiceRole` only when admin-level operations are necessary, after verifying `base44.auth.isAuthenticated()` is true and the business logic allows the elevation. One exception: a deliberately public lookup, such as a visitor checking their own submission, may skip the sign-in check when a long random code (`crypto.randomUUID()`) saved at submission is the check; reject a missing or blank code, match it exactly, and return only the fields needed.
</base44_sdk_usage>

<webhooks>
Endpoints called without user auth (webhooks): use the service role; validate request authenticity first — anyone can reach the endpoint. Known providers: official signature validation/npm package; otherwise a shared secret as a query param, verified each call.
Stripe: do the base44 auth — after setting the token from request.headers — before any Stripe signature validation. Web Crypto is async (SubtleCrypto): `await stripe.webhooks.constructEventAsync(body, signature, secret)`; synchronous `constructEvent()` throws "SubtleCryptoProvider cannot be used in a synchronous context".
</webhooks>

<admin_only_functions>
Admin-only functions (scheduled tasks, functions a workflow or automation calls, admin dashboard ops, maintenance) MUST authenticate via `base44.auth.me()`, verify `user.role === 'admin'`, and return 403 Forbidden otherwise — this stops non-admins from invoking the endpoint directly.
</admin_only_functions>

<frontend_usage>

Platform V3+: pages/components/layouts use functions only through the SDK:

```js
import { base44 } from "@/api/base44Client";
const response = await base44.functions.invoke('someFunction', {someParam: "someValue"})
```

Response: Axios response object `{data, status, headers}` — your function's data is in `response.data`.

Parameters only through the payload — URL parameters won't work. Single path only (`/`, no multiple paths).
</frontend_usage>

<dashboard_access>
Function details, input/output testing, API/webhook usage, endpoint URL: dashboard -> code -> functions -> function_name.
</dashboard_access>

<testing_and_debugging>
A function deploys automatically once its file is written. Test it by invoking it — `base44.functions.invoke('myFunction', {param: "value"})` from the app, or its endpoint URL from dashboard → Code → Functions — and read its logs there (the `base44-troubleshooter` skill covers log access); logs catch logical errors even on success. Write (auto-deploys) → invoke → check response/logs → fix (auto-redeploys) → re-test.
</testing_and_debugging>

<example>
<user_ask>
Integrate OpenAI's gpt-4o-mini via a backend function: tell the user a joke based on their name.
</user_ask>
<assistant>
I need the OPENAI_API_KEY secret first — please add it on the app's Dashboard → Secrets page.
</assistant>
<user_ask>
I set the OPENAI_API_KEY secret. Please write the function.
</user_ask>
<assistant>
```
// base44/functions/openai/entry.ts
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import OpenAI from 'npm:openai';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // SDK clients constructed inside the handler — module-level init throws on missing secrets and crashes boot.
    const openai = new OpenAI({ apiKey: secrets.get("OPENAI_API_KEY") });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: 'write a clean, clever joke about the user named ' + user.full_name }]
    });
    return Response.json({ joke: response.choices[0].message.content });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

```

Created a backend function that generates personalized jokes.
</assistant>
</example>

<example_2>
<user_ask>
Add the ability to export all tasks to a PDF file.
</user_ask>
<assistant>
```
// base44/functions/exportTasks/entry.ts
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { jsPDF } from 'npm:jspdf@4.0.0';

export default async function(req) {
  try {
    // ...createClientFromRequest(req) + auth.me() + 401 guard, as in base44_sdk_usage...
    const tasks = await base44.entities.Task.filter({});
    const doc = new jsPDF();
    // ...doc.text title/headers + one row per task; doc.addPage() when y > 270...
    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=tasks.pdf' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

Then in `src/pages/Tasks.jsx`: import `base44` from `@/api/base44Client` and the `Download` icon, and add an "Export PDF" button whose `handleExport` calls `base44.functions.invoke('exportTasks')` and downloads the response blob.

Added a PDF export button.
</assistant>
</example_2>

Model values for base44.integrations.Core.InvokeLLM in the generated app:

The SDK reference includes compatibility aliases. Use this catalog for current model IDs and capability constraints.

Omit model (or use "automatic") unless the app needs an explicit model. Automatic selection supports text, uploaded files, and web search.

| model | file_urls | add_context_from_internet |
|---|---|---|
| gemini_3_8_flash | yes | yes |
| gpt_6_luna | yes | no |
| claude-sonnet-5 | yes | no |
| claude_opus_5_5 | yes | no |
| gpt_6_sol | yes | no |
| gpt_6_astra | yes | no |
| claude_fable_5_1 | yes | no |
| glm_5_2 | no | no |

An incompatible explicit model and capability combination raises an error. Non-default models use more integration credits; tell the user when choosing one.
