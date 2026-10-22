<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 backend functions: Server functions and server routes (TanStack Start)

<overview>
All server-side code is a TanStack Start server function or server route under `src/`, run by Base44 on Cloudflare Workers. Prefer built-in integrations and connectors when they cover the need. Core integrations that read a user's files or spend credits (`InvokeLLM`, `ExtractDataFromUploadedFile`, transcription, image generation) run in a server function: upload from the browser, then pass the `file_url`/`file_uri` to it — never parse PDFs, images or spreadsheets in the browser.
</overview>

<server_function_or_server_route>
- Server function — `createServerFn({ method })` in `src/lib/server-fns.js` (or another module a route imports; server-only helpers go in `*.server.js` files, kept out of the browser bundle). The default for anything a page needs from the server: loader data, writes, calls that need a secret. An RPC called from a `loader` (`loader: () => listOrders()`) or a component (`useServerFn(createOrder)` + a TanStack Query mutation); `GET` reads, `POST` writes; validate with zod `.validator(z.object({ … }))` and call as `fn({ data: { … } })`: only `data` reaches the handler, so pass one object (an update is `fn({ data: { id, ...patch } })`), never a bare id.
- Server route — `src/routes/api/<name>.js`: `createFileRoute("/api/<name>")({ server: { handlers: { GET: async ({ request, params, context }) => Response.json(...) } } })`. A raw HTTP endpoint, only for a URL something other than this app's own code requests: webhooks and callbacks, a link or image the browser loads by itself (`<a href>`, `<img src>`), feeds and public APIs, tools an in-app agent or the app's MCP server calls. The app's own code never fetches its own routes — streamed AI replies and third-party calls are server functions. Never define a route under `/api/apps`, `/api/app-logs` or `/ws-user-apps` — shadowing the Base44 platform API breaks the app's data layer.
- An AI chat or agent loop (streamed replies, the model calling tools) is a server function running TanStack AI on the app's AI gateway, with no API key: see the `base44-platform-agents` skill for the pattern before writing one, rather than streaming InvokeLLM output by hand.
- Logic two handlers share lives in a plain module both import — never one calling the other over HTTP.
</server_function_or_server_route>

<base44_on_the_server>
Every server function and server route handler receives `context.getBase44()` (wired in `src/start.js`): a Base44 SDK client acting as the visitor — anonymous when nobody is signed in — so entity access rules apply as in the browser. `context.getBase44().asServiceRole` bypasses them: use it only when the handler must see more than its caller, and never return more than the caller should see. Entities, users, connectors (`getConnection`) and `integrations.Core.*` use the browser SDK's API; auth comes from the platform headers, so nothing needs configuring. Call `getBase44()` only in handlers that need Base44 — a handler that never calls it must still answer without those headers.
A failed SDK call rejects with an error carrying the HTTP `status`; `entities.<Name>.get(id)` rejects with 404 when the record is missing or hidden by the caller's access rules. When a route should show not-found, return null from the server function for that 404 and `throw notFound()` in the loader; rethrow every other error.
</base44_on_the_server>

<caller_auth>
Server functions and server routes are public endpoints: anyone can call them, with any input. Before `asServiceRole` or credit-spending work (Core integrations such as InvokeLLM), verify the caller and that the business logic allows it: `.middleware([requireUser])` from `@/lib/auth-middleware` (`createServerFn({ method: "POST" }).middleware([requireUser]).handler(({ context }) => …)`) rejects anonymous callers with 401 and sets `context.user`; a server route whose callers send a Base44 token uses `server: { middleware: [requireUserRoute], handlers }` from the same module, the same way (only on `src/routes/api/*` files — a route's middleware also runs for every route under it). Links and images the browser loads by itself carry no token, so a route serving them is public or checks a short-lived signed token a server function issued. Admin-only handlers also require `context.user.role === "admin"` and reject anyone else with 403. Skip the sign-in check only for a deliberately public feature (a no-login app whose visitors are meant to trigger it), and bound its input: `.max()` on every string and array, `z.enum` for choices. Webhooks verify the request's signature or shared secret instead.
</caller_auth>

<secrets>
Before writing server code that needs an API key or secret, check it is set — an unset secret fails. If missing, ask the user to add it in the app dashboard (Settings → Environment variables) and wait for their confirmation before writing code that reads it. Read it with `import { secrets } from "base44:runtime"` → `secrets.get("NAME")` (`undefined` if unset) only in server functions, server routes and `*.server.js` files; never `process.env` or a `VITE_*` var (build-time, client-visible). A set or rotated secret reaches the dev preview and the latest commit's worker within seconds — no redeploy; a published app behind the latest commit picks it up on its next publish.
</secrets>

<runtime>
Server code runs on Cloudflare Workers with `nodejs_compat`: most Node built-ins work, but there is no filesystem, no state shared between requests (module-level caches reset at any time), and no timer that outlives a response — `waitUntil` from `base44:runtime` keeps post-response work alive. Web-standard APIs over dependencies (`fetch`, not axios). `console.log` from server code is not shown to the user anywhere: while debugging, return the diagnostic in the response.
</runtime>
