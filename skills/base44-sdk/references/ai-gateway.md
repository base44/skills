# AI Gateway Module

Call Base44's managed AI models from your own backend code via `base44.aiGateway`.

> **Note:** Intended for backend functions. It uses your app's models, billing, and
> credit quota — there is no API key to manage.

## Overview

`connection()` returns a `baseURL`, bearer `token`, and `headers` to hand to a client
library. Two providers sit behind it:

| Provider | Endpoints | Client |
|----------|-----------|--------|
| `openai` (default) | Chat Completions, `/images/generations`, `/images/edits`, `/videos` | Any OpenAI-compatible client (Vercel AI SDK, Mastra, the `openai` SDK, …) |
| `typesafe` | Structured evaluations with the `jev` model | `@ai-sdk/typesafe-ai` + `ai`'s `experimental_evaluate` |

Every call is metered against your app's credit quota, the same quota
`integrations.Core.*` uses.

## When to use it

| Use | When |
|-----|------|
| **`integrations.Core.InvokeLLM`** | A **single** call, no tools. Don't chain it to simulate an agent loop. See [integrations.md](integrations.md). |
| **In-app agents** (`base44.agents`) | **Managed and conversational** — app users talk to it and the platform runs the agent loop for you. See [base44-agents.md](base44-agents.md). |
| **Code agents** (gateway chat) | **Programmable, not a conversation** — a backend function where **your** code owns the loop, tools, model, and result; triggered by an entity event / schedule / webhook, not a chat. |
| **`integrations.Core.GenerateImage`** | One image from a prompt, default settings. |
| **Gateway images** | Several images per request, a specific model, aspect ratio or resolution, reference images, or editing an existing image. |
| **Gateway videos** | Any video generation. It is an asynchronous job: create, then retrieve later. |
| **AI decisions** (gateway `typesafe`) | Classify, score, or route a record against named criteria and get probabilities back — instead of `InvokeLLM` with a JSON schema. |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `connection(options?)` | `({ provider?: "openai" \| "typesafe" }) => AiGatewayConnection` | Returns `{ baseURL, token, headers }` for the selected provider. Defaults to `openai`. |

Available in user mode (`base44.aiGateway`, the default — runs with the caller's
permissions) and with the service-role token (`base44.asServiceRole.aiGateway`) for
genuine cross-user or system work.

`headers` requires `@base44/sdk` 0.8.52+ and `provider` requires 0.8.50+.

## Rules for every gateway call

- **Backend function only** (`createClientFromRequest(req)`). All other backend-function
  rules (deployment, secrets, error handling) apply — see the functions guide. Never send
  the gateway `token` to the browser.
- **Guard the function** with `await base44.auth.me()` before calling the gateway.
- **Always pass `headers`** to the client (`defaultHeaders` for the `openai` SDK, `headers`
  for Vercel AI SDK providers). On a client from `createClientFromRequest()` it carries the
  signed `Base44-State` that a workspace IP allowlist requires; without it those
  workspaces reject the call.
- **Scope:** code agents should run in the caller's scope (`base44.aiGateway`) so their
  entity tools stay RLS-bound. Image, video, and evaluation calls don't touch entities, so
  either scope works; use `asServiceRole` when there is no signed-in caller (e.g. a
  scheduled automation).
- **Set `maxRetries: 0` on image, video, and evaluation calls.** Client retries replay
  billed requests.

## Build a code agent

1. Get the connection with `base44.aiGateway.connection()` → `{ baseURL, token, headers }`.
2. Point an agent SDK's OpenAI-compatible provider at it (`baseURL`, `apiKey: token`, `headers`).
3. Give the agent tools that read/act on your app via `base44.*`, and let it finish by
   recording its result through a tool.

**Rules:**
- **Run in the caller's scope by default.** Use `base44.aiGateway.connection()` and
  `base44.entities.*` so the agent runs with the calling user's permissions (RLS applies)
  and can't exceed them. Reach for `asServiceRole` only for genuine cross-user/system
  work — and then **scope tools to trusted context, not agent-chosen inputs** (e.g. fix
  `customer_email` from the request, not an agent parameter), since `asServiceRole` runs
  with full access.
- **Stateless between invocations.** Persistent memory means storing and replaying state
  (e.g. in an entity).
- Use model **`automatic`** unless the task needs a specific model — non-default models
  use more credits: only when needed, and tell the user.
- **Don't chain `InvokeLLM`** to fake a tool loop — use a real agent loop.
- **Always bound the loop.** `stopWhen` is an OR-list — the first condition to fire wins
  (mix a step cap like `stepCountIs`, a finish tool like `hasToolCall`, or a custom check).
  Give it room to finish but stop a runaway: **every step is another metered model call.**

Example with the Vercel AI SDK — a background reviewer the app runs on a return request:

```javascript
import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { ToolLoopAgent, tool, stepCountIs, hasToolCall } from "npm:ai@7.0.16";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@3.0.5";
import { z } from "npm:zod@4.4.3";

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { return_id } = await req.json();
  const request = await base44.entities.ReturnRequest.get(return_id);

  const { baseURL, token, headers } = base44.aiGateway.connection();
  const base44Models = createOpenAICompatible({ name: "base44", baseURL, apiKey: token, headers });

  const agent = new ToolLoopAgent({
    model: base44Models("automatic"),
    instructions:
      "Decide whether this return looks fine or needs the owner's attention. " +
      "Check the customer's past orders as many times as you need, then submit your verdict.",
    tools: {
      searchOrders: tool({
        description: "This customer's past orders, optionally filtered by status",
        inputSchema: z.object({ status: z.string().optional() }),
        execute: ({ status }) => {
          const query = { customer_email: request.customer_email };
          if (status) query.status = status;
          return base44.entities.Order.filter(query, "-created_date", 50);
        },
      }),
      submitVerdict: tool({
        description: "Record the final verdict. Call this once, when you've decided.",
        inputSchema: z.object({ decision: z.enum(["approved", "flagged"]), reason: z.string() }),
        execute: ({ decision, reason }) =>
          base44.entities.ReturnRequest.update(return_id, { status: decision, review_note: reason }),
      }),
    },
    // stops at the first to trigger — submitVerdict was called, or 8 steps elapsed;
    // mix whatever conditions fit the task (a step cap, a finish tool, a custom condition)
    stopWhen: [stepCountIs(8), hasToolCall("submitVerdict")],
  });

  await agent.generate({ prompt: `Review this return request: ${JSON.stringify(request)}` });
  return Response.json({ ok: true });
}
```

**Images as input:** when the agent needs to see an image, pass it as an image part in `messages`:

```javascript
const { text } = await agent.generate({ messages: [{ role: "user", content: [
  { type: "text", text: `Review this receipt: ${JSON.stringify(receipt)}` },
  { type: "image", image: receipt.image_url },
]}]});
```

Any OpenAI-compatible agent SDK works the same way — construct its provider/client with
the gateway's `baseURL`, `token`, and `headers`. Streaming (`stream: true`, `streamText`) is
supported.

## Generate and edit images

`POST /images/generations` and `POST /images/edits` through the `openai` SDK:

```javascript
import OpenAI from "npm:openai@6.45.0";

const { baseURL, token, headers } = base44.aiGateway.connection();
const client = new OpenAI({ baseURL, apiKey: token, defaultHeaders: headers, maxRetries: 0 });

const { data, usage } = await client.images.generate({
  model: "automatic",
  prompt: `${description}. Studio lighting.`,
  n: 1,                         // 1-4 images per request
  response_format: "url",       // "url" or "b64_json"; default "b64_json"
  // Base44 extensions beyond the OpenAI spec:
  aspect_ratio: "16:9",
  resolution: "1K",             // higher resolutions are model-specific
  reference_image_urls: [url],  // image inputs by URL
});
// data[0].url is the stored image URL; usage.base44_credits is the charged amount.
```

- **Editing:** `client.images.edit({ model, prompt, image })` needs at least one input
  image — uploaded bytes in `image`, or `reference_image_urls`. Generations accept
  `reference_image_urls` too.
- **Other options:** `quality`, `output_format`, `background` (transparent/opaque) — support is model-specific.
- **Models:** prefer `"automatic"`, which picks a model that supports the requested options.
  Pin one (e.g. `gemini_3_1_flash_image`, `gpt_image_2`) only when needed. Unsupported
  option/model combinations return **400**. Full model list and limits:
  [Generate images with the AI Gateway](https://docs.base44.com/developers/references/sdk/getting-started/ai-gateway-images).
- **Cost preview:** add `dry_run: true` to the same request to get
  `{ dry_run: true, model, usage: { base44_credits } }` without generating or charging.

With the Vercel AI SDK, use `models.imageModel("automatic")` with `generateImage` and pass
the Base44 extensions under `providerOptions: { base44: { ... } }` (the key is the `name`
you gave `createOpenAICompatible`).

## Generate videos

Video generation is an **asynchronous job** through the `openai` SDK's `videos` client.
`videos.create()` returns a job `id` right away; the video is ready later.

```javascript
import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import OpenAI from "npm:openai@6.45.0";

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { action, request, videoId } = await req.json();
  const { baseURL, token, headers } = base44.aiGateway.connection();
  const { videos } = new OpenAI({ baseURL, apiKey: token, defaultHeaders: headers });

  if (action === "create") {
    // e.g. request = { model: "seedance_2_fast", prompt, seconds: 4 }
    return Response.json(await videos.create(request, { maxRetries: 0 }), { status: 202 });
  }
  if (action === "retrieve") {
    return Response.json(await videos.retrieve(videoId));
  }
  return Response.json({ error: "Invalid action" }, { status: 400 });
}
```

Poll from the frontend (or a later scheduled run), not inside one function invocation —
a backend function is a bounded HTTP call:

```javascript
const isProcessing = (status) => status === "queued" || status === "in_progress";

let { data: video } = await base44.functions.invoke("video-gateway", {
  action: "create",
  request: { model: "seedance_2_fast", prompt, seconds: 4 },
});
for (let attempt = 0; isProcessing(video.status) && attempt < 40; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 15_000));
  ({ data: video } = await base44.functions.invoke("video-gateway", {
    action: "retrieve",
    videoId: video.id,
  }));
}
if (video.status === "failed") throw new Error(video.error?.message || "Video generation failed");
// video.url is the stored video once status is "completed"
```

- **Statuses:** `queued`, `in_progress`, `completed`, `failed`. Treat `queued`/`in_progress`
  or hitting your polling limit as **unfinished, not failed**. For background flows,
  persist `video.id` (e.g. in an entity) and retrieve it in a later run.
- **Models:** there is **no `automatic`** — pass a specific model:
  `veo_3_1_lite`, `veo_3_1_fast`, `seedance_2`, `seedance_2_5`, `seedance_2_fast`,
  `seedance_2_mini`, `kling_3`, `minimax_h3`, `minimax_h3_max`, `grok_imagine_video`,
  `grok_imagine_video_1_5`. Supported `seconds`, `resolution`, `aspect_ratio`, and
  references differ per model; unsupported values return **400**.
- **Request fields:** `model`, `prompt`, `seconds`, `aspect_ratio`, `resolution`,
  `generate_audio`, `seed`, `dry_run`, and either `frame_images` (up to 2, each
  `{ type: "image_url", image_url: { url }, frame_type: "first_frame" | "last_frame" }`) or
  `input_references` (up to 8 image/video/audio URLs, each
  `{ type: "image_url", image_url: { url } }` and likewise for `video_url` / `audio_url`) —
  don't combine the two. Reference URLs must be public HTTPS URLs.
- **Cost preview:** `videos.create({ ...request, dry_run: true })` returns HTTP 200 with
  `usage.base44_credits` and **no job id** — don't poll it.

## AI decisions (Jev)

Structured evaluations: give the `jev` model some state and a set of questions, and get
each answer back with probabilities. Use it to classify, score, or route; then apply your
own thresholds and actions in deterministic code.

```javascript
import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { experimental_evaluate as evaluate } from "npm:ai@7.0.105";
import { createTypeSafeAi } from "npm:@ai-sdk/typesafe-ai@3.0.4";

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  const { baseURL, token, headers } = base44.aiGateway.connection({ provider: "typesafe" });
  const typesafe = createTypeSafeAi({ baseURL, apiKey: token, headers });

  const result = await evaluate({
    model: typesafe.evaluationModel("jev"),
    maxRetries: 0, // avoid automatic replays of billed requests
    state: { message },
    questions: {
      department: { type: "choice", instructions: "Which team should handle this?",
        criteria: { billing: "Payments and refunds", support: "Other requests" } },
      urgency: { type: "score", instructions: "How urgent is this?",
        criteria: ["No deadline", "Requested today", "Immediate emergency"] },
      refund: { type: "boolean", instructions: "Is a refund explicitly requested?" },
    },
  });
  return Response.json({ answers: result.answers });
}
```

**Request:**
- `state` — string, JSON object, or array (an array is one state).
- `questions` — non-empty; questions can't depend on other answers in the same call.
  - `choice`: `criteria` required, an object of 1–255 named options (descriptions may be `null`).
  - `score`: `criteria` required, an array of 2–10 ordered rubric levels.
  - `boolean`: `criteria` optional, an object with only `true`/`false` keys.
  - `instructions` and criteria descriptions may be a string, JSON object, or JSON array.

**Response** (answer keys match question ids):

```javascript
{
  answers: {
    department: { type: "choice", choice: "billing", probabilities: { billing: 0.97, support: 0.03 } },
    urgency: { type: "score", score: 1.2, probabilities: { 0: 0.1, 1: 0.6, 2: 0.3 } }, // 0..criteria.length-1, may be fractional
    refund: { type: "boolean", probability: 0.99 }, // P(true)
  },
  providerMetadata: {
    typesafe: { confidence: { department: 0.9, urgency: 0.7 } }, // choice/score only; entries may be absent
  },
}
```

## Models

- **Chat:** any model available through `InvokeLLM`. Use **`automatic`** (the default,
  cheapest) unless the task needs a specific model (e.g. `claude_sonnet_4_6`). Non-default
  models cost more credits — use them only when needed, and tell the user.
- **Images:** `automatic` or a pinned image model — see [Generate and edit images](#generate-and-edit-images).
- **Videos:** always a specific model — see [Generate videos](#generate-videos).
- **Evaluations:** `jev`.

## Notes

- **Backend only.** `token` is the current caller's bearer — the app user's token for
  `base44.aiGateway`, the service-role token for `base44.asServiceRole.aiGateway`, or an
  empty string when unauthenticated.
- **Billing:** metered per call against your app's credit quota (same as InvokeLLM). If
  the app is out of credits, calls are rejected before the model runs.

## Type Definitions

```typescript
/** Connection details for the Base44 AI Gateway. */
interface AiGatewayConnection {
  /** Base URL of the selected gateway provider. */
  baseURL: string;
  /** Bearer token for the gateway. Empty string when the caller is unauthenticated. */
  token: string;
  /**
   * Extra headers to send with every gateway request (`defaultHeaders` for the `openai`
   * SDK, `headers` for Vercel AI SDK providers). On a client from
   * `createClientFromRequest()` this carries the signed `Base44-State` a workspace IP
   * allowlist requires; otherwise it's empty.
   */
  headers: Record<string, string>;
}

/** Options for selecting an AI Gateway provider. */
interface AiGatewayConnectionOptions {
  /** Gateway provider to connect to. Defaults to `openai`. */
  provider?: "openai" | "typesafe";
}

interface AiGatewayModule {
  connection(options?: AiGatewayConnectionOptions): AiGatewayConnection;
}
```
