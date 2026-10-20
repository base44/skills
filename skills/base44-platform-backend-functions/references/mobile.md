<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 backend functions: Backend functions (mobile apps)

When a user asks you to integrate with an external API that has no built-in integration, you can write custom backend functions to integrate with the API.
The backend functions are basically an HTTP handler that you can define in `base44/functions/{functionName}/entry.ts`.
It has to export a fetch function that will be called with the incoming request. Logic needed by more than one function must live in a `base44/shared/` module they both import — extract it, never copy it between functions.

For external webhooks, browser GET links and OAuth callbacks, use the server-set `X-Base44-App-Url` origin plus `/functions/<functionName>`. Never expose dispatcher `/run/<scriptId>` or deployment URLs; the dispatcher requires platform-only authentication. Preserve callback query parameters and validate OAuth state in the handler.

<code_validation>
**Validation Flow**: After you generate the function code, it automatically goes through lint validation before deployment.

**What gets REJECTED** (deployment fails):
- Syntax errors, missing imports, unmatched brackets/braces
- Wrong function structure or return types

**What PASSES** (deployment succeeds):
- Unused variables, `let` instead of `const`, unused catch parameters
- These "style" issues are ignored to prevent deployment loops

<mandatory_requirements>
- must use `export default async function(req) { ... }` handler - no other patterns accepted
- must declare variables before using them (use `const`, `let`, or `var`)
- must not redeclare variables already in scope (e.g. `user`, `req`)
- must prefix **external-dependency** imports with `npm:package@version` (relative imports of your own files are not external deps)
- must return Response objects - never return strings or plain objects directly
- must include proper try/catch error handling for robustness
- must validate user authentication with `base44.auth.me()` when using Base44 SDK
- must use proper JavaScript/TypeScript syntax with matched brackets and braces
- must validate all regex patterns are syntactically correct before writing
- must not throw or `await` at module top-level — keep all init inside the handler (top-level failures cause boot errors, not 500s)
- must `await` every Base44 SDK call (`base44.entities.X.list()`, `base44.auth.me()`, `base44.functions.invoke(...)` all return Promises)
- **Shared modules** - never duplicate logic across functions; extract it to a `base44/shared/` module, e.g. `import { calc } from "../../shared/calc.ts"`; own-dir helpers import as `./util.ts`.
- **Never cross the boundary** - `base44/` is server-side and never in the client bundle: never import it from a frontend file (the screen calls `base44.functions.invoke(...)` instead), and never import `src/` or `@/` from a function.
</mandatory_requirements>
</code_validation>

<guidelines>
<main_guidelines>
1. CRITICAL: before writing any function, if you need to use a secret / api key, make sure to check if it's already set. If it is missing, ask the user to add it in the app dashboard (Settings → Environment variables).
2. ADMIN-ONLY FUNCTIONS: If a function should only be invoked by admin (e.g., scheduled tasks, functions a workflow or automation calls, admin dashboard operations, system maintenance), it MUST verify the authenticated user is an admin by checking `user.role === 'admin'` and return 403 Forbidden if not.
3.

If the secrets you need are not set, ask the user to add them in the app dashboard (Settings → Environment variables) and wait for their confirmation before writing the function code.

CRITICAL: a function that reads a secret / api key that is not set fails at runtime.

For example, if the user asks for a WeatherAPI.com integration, you should request the WEATHER_API_KEY secret.

**App Connectors Overview**
When a user asks for an integration to an external service, there is a capability called **app connectors** which allows users to connect to specific services using an OAuth flow with requested scopes. The supported connectors are defined in the specific app connectors coding instructions.

**Integration Priority:**
When the user needs to integrate an external service, you MUST prioritize methods in the following order:
1. **App Connectors**: If the integration is supported by app connectors, you MUST prioritize it over all other methods. App connectors provide secure OAuth-based authentication with specific scopes.

2. **Backend Functions with Secrets**: If app connectors are not available, use backend functions with API keys/secrets.

**Important**: Always check if the requested integration is supported by app connectors first. If it is supported, use app connectors exclusively. Only fall back to other methods if the integration is not supported by app connectors.

For example, if the user wants to integrate Google Calendar and it's supported by app connectors, always use the app connector OAuth integration. If app connectors support it but backend functions are not enabled, ask the user to enable them first, then proceed with the app connector authorization flow.
</main_guidelines>

<platform_version_note>
**CRITICAL: Platform Version Differences**

The way functions are called from the frontend depends on your app's platform version:

- **Your app is Platform V3+**: Use `await base44.functions.invoke('functionName', params)`
- Import: `import { base44 } from "@/api/base44Client";`

This affects how you reference the function in your examples and documentation.
</platform_version_note>

<usage>

THE ONLY WAY TO USE A FUNCTION in a page / component / layout is to use it from the base44 sdk.
the response of the function will be an axios response object.

for example:
import { base44 } from "@/api/base44Client";

...
const response = await base44.functions.invoke('someFunction', {someParam: "someValue"})
...

The response is an Axios response object with structure: `{data, status, headers}` - your function's returned data is in `response.data`.

</usage>

<coding_instructions>
1. Prefer Web-standard APIs over external dependencies (eg: use fetch instead of Axios, use WebSockets API instead of node-ws)
2. Import every external dependency with an `npm:` specifier, e.g. `import Stripe from "npm:stripe@18.5.0"`.
3. Pin a version on every external import. For the Base44 SDK use exactly `npm:@base44/sdk@0.8.54`.
4. Already have an `esm.sh` or `unpkg.com` URL? Replace the CDN hostname with the `npm:` specifier.
5. Export a default request handler: `export default async function(req) { ... }`.
6. Secrets: `import { secrets } from "base44:runtime"` → `secrets.get("NAME")`; pre-populated: BASE44_APP_ID. Set other secrets in dashboard environment variables.
7. NEVER ask users for BASE44_SERVICE_TOKEN, BASE44_SERVICE_ROLE_KEY, or similar - these secrets don't exist. Use `createClientFromRequest(req)` for auth, and `base44.asServiceRole` for service role level operations.
8. Naming: USE ONLY camelCase for function names. No spaces, no /, no hyphens.
   **REMEMBER**: Frontend usage differs by platform version - see platform_version_note above.
9. Use `base44:runtime` for secrets (`secrets.get`) and post-response work (`waitUntil`). For work to complete after sending a response: `import { waitUntil } from "base44:runtime"; waitUntil(myAsyncOp())`.

10. Write files using javascript. No need to use typescript.
11. Don't use multiple paths, only / is allowed when making an API call.
12. Parameters can only be passed through the payload. URL parameters are not allowed and won't work.
13. CRITICAL: For stripe webhooks make sure to do base44 auth after setting the token from request.headers before ANY stripe signature validation.
14. WEB CRYPTO IS ASYNC: The runtime uses the Web Crypto API (SubtleCrypto) which is asynchronous, unlike Node.js's synchronous crypto. For Stripe webhook signature verification, you MUST use `await stripe.webhooks.constructEventAsync(body, signature, secret)` instead of `constructEvent()`. The synchronous version will throw "SubtleCryptoProvider cannot be used in a synchronous context".
15.
16. Base44 SDK usage (service role + request-based init):
    16.a Always import the SDK as: `import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';`
    16.b Create the client from the incoming request:
<example>
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // User-scoped operations (use app-user token)
        const items = await base44.entities.SampleData.list();

        // Service-scoped operations (admin privileges)
        const allItems = await base44.asServiceRole.entities.SampleData.list();

        return Response.json({ items, allItems });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

</example>
    16.c When to use service role vs user auth:
        * Prefer user-scoped calls (`base44.entities/...`) when responding to frontend/user actions.
        * Use service role (`base44.asServiceRole`) only when necessary for admin-level operations and AFTER verifying:
            * There is an authenticated user (base44.auth.isAuthenticated() is true), and
            * The business logic allows elevating privileges for this action.
        * For webhooks or endpoints intended to be called without user authentication:
            * Use the service role to interact with Base44.
            * FIRST validate the request authenticity:
                * If it's a webhook from a known provider, use its official signature validation or npm package.
                * Otherwise, suggest adding a shared secret as a query param when registering the webhook and verify it on each call.
        * With `base44.asServiceRole` you can use the following methods:
            * `base44.asServiceRole.entities` - For working with entities as admin.
            * `base44.asServiceRole.functions` - Call backend functions.
            * `base44.asServiceRole.integrations` - Call integrations.
    16.d Calling other backend functions:
        * You can invoke another backend function via the SDK:
<example>
const res = await base44.functions.invoke('myFunction', { foo: 'bar' });
</example>
17. **SHARED CODE**: Never duplicate logic across functions — put it in a `base44/shared/` module and import it (`import { x } from "../../shared/x.ts"`); own-dir helpers import as `./util.ts`.
18. Never load full datasets into memory — paginate entity queries, stream large external responses.
19. **Fast requests**: requests are cut at 5min and a Worker holds 6 connections at once. Run independent calls in `Promise.allSettled` batches of ~6, never one await per item; one `filter({ id: { $in: ids } })` instead of a get per id; every outbound `fetch` takes `signal: AbortSignal.timeout(ms)` sized to the API (~10s, more for LLM/media); on 429 back off or fail, never a tight retry loop.
20. Do NOT use `eval()` or `new Function()`.
21. Do NOT instantiate WebAssembly from bytes constructed at runtime.
</coding_instructions>

<admin_only_functions_guideline>
**CRITICAL: Admin-Only Function Authentication**

When creating backend functions that should ONLY be invoked by admin (e.g., scheduled tasks, functions a workflow or automation calls, admin dashboard operations, system maintenance), the function MUST:

1. **Authenticate the user** using `base44.auth.me()`
2. **Verify the user is an admin** by checking `user.role === 'admin'`
3. **Return 403 Forbidden** if the user is not an admin

<example>
const base44 = createClientFromRequest(req);
const user = await base44.auth.me();

if (user?.role !== 'admin') { return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 }); }

// Proceed with admin-only operations...
</example>

This prevents non-admin users from invoking sensitive operations by directly calling the function endpoint.
</admin_only_functions_guideline>

</guidelines>

<when_to_use_backend_functions>
Use backend functions only when the user asks you to integrate with an external API that has no built-in integration.
Always prefer to use the built-in integartions, as described in integrations, over using backend functions.

</when_to_use_backend_functions>

<example>

<user_ask>
Please integrate OpenAI's gpt-4o-mini model to the app, using a backend function.
I want you to tell a joke to the user based on their name.
</user_ask>

<assistant>
Before writing such a function, I will need your help to set the OPENAI_API_KEY secret.

[Assistant requests the OPENAI_API_KEY secret with description: "Please provide your OpenAI API key. You can get it from https://platform.openai.com/api-keys by creating an account and generating a new API key."]
</assistant>

<user_ask>
I have now set the OPENAI_API_KEY secret.
Please write the backend function.
</user_ask>

<assistant>
Sure, let me create the function for you.

[Assistant creates base44/functions/openai/entry.ts with the following content:]

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import OpenAI from 'npm:openai';
import { secrets } from 'base44:runtime';

export default async function(req) {
    try {
        const base44 = createClientFromRequest(req);

        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Construct SDK clients inside the handler — module-level init throws on missing
        // secrets and crashes boot (no try/catch reached, no logs from app code).
        const openai = new OpenAI({ apiKey: secrets.get("OPENAI_API_KEY") });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a witty comedian specializing in clean, clever jokes."
                },
                {
                    role: "user",
                    content: 'write a joke about the user named ' + user.full_name
                }
            ]
        });

        return Response.json({ joke: response.choices[0].message.content });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

I've created a backend function that uses OpenAI to generate personalized jokes.
</assistant>

</example>

<example_2>

<user_ask>
Please add the ability to export all tasks to a PDF file.
</user_ask>

<assistant>
I'll add a PDF export feature for your tasks.

[Assistant creates base44/functions/exportTasks/entry.ts:]
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { jsPDF } from 'npm:jspdf@4.0.0';

export default async function(req) {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const tasks = await base44.entities.Task.filter({});
        const doc = new jsPDF();

        // Title and headers
        doc.setFontSize(20);
        doc.text('Tasks Report', 20, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

        // Table headers
        doc.setFontSize(12);
        doc.text('Task', 20, 45);
        doc.text('Status', 100, 45);
        doc.text('Priority', 140, 45);

        // Task content
        let y = 55;
        tasks.forEach((task) => {
            if (y > 270) { // New page if needed
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(10);
            doc.text(task.title, 20, y);
            doc.text(task.status, 100, y);
            doc.text(task.priority || 'normal', 140, y);
            y += 10;
        });

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=tasks.pdf'
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

[Assistant then edits the tasks screen: imports `base44` from `@/api/base44Client` and the `Download` icon, and adds an "Export PDF" button whose `handleExport` calls `base44.functions.invoke('exportTasks')`.]

Added a PDF export button that generates a beautifully formatted tasks report.
</assistant>

</example_2>

<additional_guidelines>
If the user wants more information about the function, test the input / output of the function,
use it from an API or as a webhook -
Tell them to go to dashboard -> code -> functions -> function_name.

That's also where they'll find the url of the function endpoint.
(The frontend should only use the function from the SDK).

If an in-app agent should use a backend function you created, edited, or reused, add it to that agent's `tool_configs`.
</additional_guidelines>

<testing_and_debugging>
A function deploys automatically once its file is written. Test it by invoking it — `base44.functions.invoke('myFunction', {param: "value"})` from the app, or its endpoint URL from dashboard → Code → Functions — and read its logs there (the `base44-troubleshooter` skill covers log access); logs catch logical errors even on success.

**Typical workflow:**
1. Write the function code (automatically deploys)
2. Invoke it with a representative payload
3. Check the response and logs for issues
4. Fix the code if needed (automatically redeploys)
5. Re-test to confirm
</testing_and_debugging>

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
