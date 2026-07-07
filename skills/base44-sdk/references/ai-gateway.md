# AI Gateway Module

Connect any OpenAI-compatible SDK to Base44's managed models via `base44.aiGateway`.

> **Note:** Intended for backend functions. It uses your app's models, billing, and
> credit quota — there is no API key to manage.

## Overview

The AI Gateway exposes an **OpenAI-compatible Chat Completions endpoint** backed by
Base44's managed models. `connection()` returns the `baseURL` and bearer `token` to
hand to any OpenAI-compatible client (Vercel AI SDK, Mastra, the OpenAI SDK, and
others). Calls are metered against your app's credit quota, exactly like
`integrations.Core.InvokeLLM`.

## What you can build with it

- **Code agents** — a backend function running an agent loop (tools, multiple steps)
  the app owns. This is the main use today: see **[code-agents.md](code-agents.md)**.
- Direct single-call completions are also possible, but for a one-shot prompt with no
  tools prefer `integrations.Core.InvokeLLM` today (see [integrations.md](integrations.md)).

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `connection()` | `AiGatewayConnection` | Returns `{ baseURL, token }` for an OpenAI-compatible client |

Available in user mode (`base44.aiGateway`) and with the service-role token
(`base44.asServiceRole.aiGateway`) — use the service role inside backend functions.

## Usage

```javascript
import { createClientFromRequest } from "npm:@base44/sdk@0.8.36";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@3.0.5";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Service-role connection (backend function)
  const { baseURL, token } = base44.asServiceRole.aiGateway.connection();

  // Point any OpenAI-compatible SDK at the gateway, then use it with your agent SDK.
  const base44Models = createOpenAICompatible({ name: "base44", baseURL, apiKey: token });
  // e.g. base44Models("automatic") — see code-agents.md for a full agent example.

  return Response.json({ ok: true });
});
```

## Models

Pass a model id as the client's `model`. Use **`automatic`** (the default, cheapest)
unless the task needs a specific model (e.g. `claude_sonnet_4_6`). Non-default models
cost more credits — use them only when needed, and tell the user.

## Notes

- **Backend only.** The realistic entry point is a backend function via
  `createClientFromRequest(req)`. `token` is the current caller's bearer — the app
  user's token for `base44.aiGateway`, the service-role token for
  `base44.asServiceRole.aiGateway`, or an empty string when unauthenticated.
- **No streaming.**
- **Billing:** metered per call against your app's credit quota (same as InvokeLLM).

## Type Definitions

```typescript
/**
 * A connection to the Base44 AI Gateway — the base URL and bearer token to use
 * with any OpenAI-compatible client pointed at the gateway.
 */
interface AiGatewayConnection {
  /** Base URL of the gateway's OpenAI-compatible endpoint. */
  baseURL: string;
  /** Bearer token used to authenticate requests to the gateway. */
  token: string;
}

interface AiGatewayModule {
  connection(): AiGatewayConnection;
}
```
