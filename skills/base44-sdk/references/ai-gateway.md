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

## When to use it

The gateway is for **code agents** — a backend function running an agent loop (tools,
multiple steps) the app owns. Compared to the other AI surfaces:

| Use | When |
|-----|------|
| **`integrations.Core.InvokeLLM`** | A **single** call, no tools. Don't chain it to simulate an agent loop. See [integrations.md](integrations.md). |
| **In-app agents** (`base44.agents`) | A **managed chat product**: app users talk to it, the platform owns the conversation, the loop, and the model. See [base44-agents.md](base44-agents.md). |
| **Code agents** (the gateway) | AI as the app's **machinery, not a conversation**. Your code decides what triggers it (an entity event, a schedule, a webhook — not a chat), what tools it has, how it runs (steps, model), and what happens with the result. |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `connection()` | `AiGatewayConnection` | Returns `{ baseURL, token }` for an OpenAI-compatible client |

Available in user mode (`base44.aiGateway`) and with the service-role token
(`base44.asServiceRole.aiGateway`) — use the service role inside backend functions.

## Build a code agent

1. Get the gateway connection with `base44.asServiceRole.aiGateway.connection()` →
   `{ baseURL, token }`.
2. Point an agent SDK's OpenAI-compatible provider at it (`baseURL` + `apiKey: token`).
3. Give the agent tools that call your app (entities, other functions), run the loop,
   and do something with the result.

**Rules:**
- **Backend function only** (`createClientFromRequest(req)`, `asServiceRole`). All other
  backend-function rules (deployment, secrets, error handling) apply — see the functions guide.
- **Stateless between invocations.** Persistent memory means storing and replaying state
  (e.g. in an entity).
- Use model **`automatic`** unless the task needs a specific model — non-default models
  use more credits: only when needed, and tell the user.
- **No streaming.**
- **Don't chain `InvokeLLM`** to fake a tool loop — use a real agent loop.

Example with the Vercel AI SDK — a background reviewer the app invokes when a return
request is created:

```javascript
import { createClientFromRequest } from "npm:@base44/sdk@0.8.36";
import { ToolLoopAgent, tool, isStepCount } from "npm:ai@7.0.16";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@3.0.5";
import { z } from "npm:zod@4.4.3";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { return_id } = await req.json();
  const request = await base44.asServiceRole.entities.ReturnRequest.get(return_id);

  const { baseURL, token } = base44.asServiceRole.aiGateway.connection();
  const base44Models = createOpenAICompatible({ name: "base44", baseURL, apiKey: token });

  const agent = new ToolLoopAgent({
    model: base44Models("automatic"),
    instructions:
      "Decide whether this return request looks fine or needs the owner's attention. " +
      "Search the customer's history as many times as you need, then give a short verdict with your reasons.",
    tools: {
      searchOrders: tool({
        description: "Search this customer's past orders",
        inputSchema: z.object({ customer_email: z.string() }),
        execute: ({ customer_email }) =>
          base44.asServiceRole.entities.Order.filter({ customer_email }),
      }),
    },
    stopWhen: isStepCount(8),
  });

  const { text } = await agent.generate({ prompt: `Review this return request: ${JSON.stringify(request)}` });
  await base44.asServiceRole.entities.ReturnRequest.update(return_id, { review_note: text });
  return Response.json({ review: text });
});
```

Any OpenAI-compatible agent SDK works the same way — construct its provider/client with
the gateway's `baseURL` and `token`.

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
