---
name: base44-sandbox
description: "Develop a Base44 app remotely inside Base44's cloud sandbox using your own agent — no local checkout and no CLI. The implementation is remote: writing a file into the sandbox is what ships it (the platform builds and deploys from there). This skill is the place for learning what you can author in the sandbox today and how backend-function code is structured. Triggers on 'develop my Base44 app remotely', 'no local files', 'cloud sandbox', 'bring my own agent', or any work editing a Base44 app inside a sandbox."
---

# Base44 in the Cloud Sandbox

Author Base44 app code **inside Base44's cloud sandbox** with your own coding agent. There is no local checkout: you read, write, and run files through the sandbox bridge, and the platform builds and deploys from what you write.

For **how to connect** to the sandbox (MCP endpoint, the HTTP bridge, the `read_file` / `write_file` / `edit_file` / `run_command` / `grep` / `list_directory` tools, the edit→preview→verify loop, persistence, and concurrency), use the **`base44-remote-dev`** skill. This skill covers **what you can author and how** once you are connected.

## ⚡ The mental model: writing the file *is* the deploy

You are working on a **remote** app, not a local checkout. There is **no Base44 CLI in this workflow** — `base44 deploy`, `base44 functions deploy`, `base44 ... push`, `base44 create`, etc. are local-project commands that do not apply and should not be run here.

Instead: **as soon as you write a backend-function file into the sandbox, the platform deploys it from there.** Your write is auto-committed (~5s debounce) and the function goes live. You do not run, and must not wait for, any deploy command.

You *may* still use `run_command` for ordinary checks (e.g. `npm run build`, `npx tsc --noEmit`, `npm run lint`) and preview — that is verification, not deployment. See the edit→preview→verify loop in `base44-remote-dev`.

## What you can author today

| Resource | Status in the sandbox |
|----------|-----------------------|
| **Backend functions** (`base44/functions/`) | ✅ Supported — write the files; they deploy from the sandbox. |
| **Frontend code** (`src/…`) | ✅ Supported — edit normally; HMR/preview reflects it. Use the **`base44-sdk`** skill for SDK API usage. |
| **Entities** (`base44/entities/`) | 🚫 Not supported at the moment. |
| **Connectors** (`base44/connectors/`) | 🚫 Not supported at the moment. |
| **Agents** (`base44/agents/`) | 🚫 Not supported at the moment. |

For entities, connectors, and agents, do not author or modify them through the sandbox for now.

## Backend functions

Backend functions live in `base44/functions/`, one directory per function (kebab-case name), each with a `function.jsonc` config and an entry file:

```
base44/functions/
  process-order/
    function.jsonc
    index.ts
```

`function.jsonc`:
```jsonc
{ "name": "process-order", "entry": "index.ts" }
```
- `name` — required, must match `/^[^.]+$/` (no dots). Match the directory name.
- `entry` — required, the entry file relative to the function directory (e.g. `index.ts`).

Entry file — functions run on **Deno** (not Node.js), export with `Deno.serve()`, and use the `npm:` prefix for npm packages:
```typescript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);   // inherits the caller's auth
  const { orderId } = await req.json();
  const order = await base44.entities.Orders.get(orderId);
  return Response.json({ success: true, order });
});
```
Conventions:
- **Kebab-case** directory and function name; entry typically `index.ts`.
- `createClientFromRequest(req)` for a client in the caller's auth context; `base44.asServiceRole.…` for admin-level operations.
- Read secrets with `Deno.env.get("KEY")` (configured in app settings).
- Return with `Response.json(body, { status })`; handle errors and set appropriate status codes.

That's enough to author functions correctly. For deeper detail and more examples (service role, secrets, common mistakes), see the `base44-cli` skill's reference: [`functions-create.md`](../base44-cli/references/functions-create.md) — but **ignore its "Deploying Functions" / CLI sections**, which assume a local project and do not apply in the sandbox.

## Workflow in the sandbox

1. **Orient** — `list_directory` / `read_file` / `grep` to understand the app before changing anything.
2. **Author** — create or edit backend-function files (and frontend code) following the conventions above.
3. **Verify** — optionally `run_command` `npm run build` / `npx tsc --noEmit`, and use `get_app_preview_url` to eyeball changes (see `base44-remote-dev`).
4. **Let it ship** — do **nothing** to deploy. Writing the file is the deploy; the auto-commit (~5s) persists and ships it. Pause a moment after your last edit before disconnecting so the commit lands.
