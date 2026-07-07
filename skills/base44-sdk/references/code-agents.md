# Code Agents

Build an AI agent that runs as a **backend function** — an agent loop (tools, multiple
steps) the app owns — against Base44's managed models through the [AI
Gateway](ai-gateway.md). The gateway speaks OpenAI Chat Completions, so any
OpenAI-compatible agent SDK works (Vercel AI SDK, Mastra, and others).

## Which AI surface? (decide before you build)

| Use | When |
|-----|------|
| **`integrations.Core.InvokeLLM`** | A **single** call, no tools. Don't chain it to simulate an agent loop — that hard-codes the decisions the AI was supposed to make. See [integrations.md](integrations.md). |
| **In-app agents** (`base44.agents`) | A **managed chat product**: app users talk to it, the platform owns the conversation, the loop, and the model. JSON config in `base44/agents/`, WhatsApp/Telegram channels, needs an in-app conversation UI. See [base44-agents.md](base44-agents.md). |
| **Code agents** (this doc) | AI as the app's **machinery, not a conversation**. Your code decides what triggers it (an entity event, a schedule, a webhook — not a chat), what tools it has (any code you write), how it runs (state across steps, step limits, which model), and what happens with the result. |

Build a **code agent** when AI is part of the app's machinery rather than a chat
surface, or when in-app agent config can't express the behavior (inline tools,
multi-agent, runtime-computed instructions).

## How it works

1. Get the gateway connection with `base44.asServiceRole.aiGateway.connection()` →
   `{ baseURL, token }`.
2. Point an agent SDK's OpenAI-compatible provider at it (`baseURL` + `apiKey: token`).
3. Give the agent tools that call your app (entities, other functions), run the loop,
   and do something with the result (store it, return it).

**Key rules:**
- **Backend function only** (`createClientFromRequest(req)`, `asServiceRole`). All other
  backend-function rules (deployment, secrets, error handling) apply — see the
  functions guide.
- **Stateless between invocations.** Persistent memory means storing and replaying state
  (e.g. in an entity).
- Use model **`automatic`** unless the task needs a specific model — non-default models
  use more credits: only when needed, and tell the user.
- **No streaming.**

## Example — Vercel AI SDK

A background reviewer the app invokes when a return request is created:

```javascript
import { createClientFromRequest } from "npm:@base44/sdk";
import { ToolLoopAgent, tool, isStepCount } from "npm:ai";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
import { z } from "npm:zod";

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

## Example — Mastra

```javascript
import { createClientFromRequest } from "npm:@base44/sdk";
import { Agent } from "npm:@mastra/core/agent";
import { createTool } from "npm:@mastra/core/tools";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
import { z } from "npm:zod";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { baseURL, token } = base44.asServiceRole.aiGateway.connection();
  const base44Models = createOpenAICompatible({ name: "base44", baseURL, apiKey: token });

  const agent = new Agent({
    id: "order-helper",
    name: "order-helper",
    instructions: "Help resolve questions about orders using the lookup tool.",
    model: base44Models("automatic"),
    tools: {
      lookupOrder: createTool({
        id: "lookup-order",
        description: "Fetch an order by id",
        inputSchema: z.object({ orderId: z.string() }),
        execute: async ({ context }) =>
          base44.asServiceRole.entities.Order.get(context.orderId),
      }),
    },
  });

  const { text } = await agent.generate("Where is order 123?");
  return Response.json({ text });
});
```

## Any OpenAI-compatible SDK

Because the gateway is OpenAI Chat Completions compatible, any client works — construct
it with the gateway's `baseURL` and `token`:

```javascript
import OpenAI from "npm:openai";
const { baseURL, token } = base44.asServiceRole.aiGateway.connection();
const client = new OpenAI({ baseURL, apiKey: token });
```

Drive the tool loop with the SDK's tool-calling. For a **single** call with no tools,
use `integrations.Core.InvokeLLM` instead (see [integrations.md](integrations.md)).

## Anti-patterns

- **Don't chain `InvokeLLM` calls** (or pre-fetch everything into one prompt) to fake an
  agent loop — that hard-codes the decisions the AI was supposed to make. Use a real
  tool loop.
- **Don't build a code agent for a chat product.** If app users should talk to it, use
  [in-app agents](base44-agents.md).
