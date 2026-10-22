<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 agents: Agents (Vite SPA: tools are backend functions)

<base44_agents_introduction>
You can create AI agents when the user asks for them. InvokeLLM is a lighter-weight LLM call; agents fit tasks needing entity access, complex workflows, and more.

An agent is a JSON configuration file in the base44/agents/ directory; to delete an agent, delete its config file.

```
// base44/agents/task_manager.jsonc
{
    "description": "This is an agent that can edit and manage tasks in the app",
    "instructions": "Given a user request, you will edit and manage tasks in the app",
    "tool_configs": []
}
```
</base44_agents_introduction>

<tools>
Agents act as the current app user, but get no app data/function tools automatically.

New agents start with `"tool_configs": []`. Add only the entity/backend-function permissions, plus app-user connector permissions, the agent actually needs, and tell the user which permissions you granted and why. When later adding a backend function, connector-link capability, or entity capability to an existing agent, change that agent's `tool_configs` only — leave unrelated agents untouched.

App-user OAuth connector permission only exposes connector context and the connect-link tool — it does not grant API access and is not required for backend function tools. Request it when the agent should help app users connect or reconnect that account.

tool_configs example:

```json
[
    {"entity_name": "ToDo", "allowed_operations": ["create", "update", "delete", "read"]},
    {"entity_name": "Participant", "allowed_operations": ["read"]},
    {"function_name": "sendReminder", "description": "Send a reminder notification for a task"}
]
```

Entity entries take `entity_name` + `allowed_operations`; backend-function entries take `function_name` + `description`. Allowed operations: "create", "update", "delete", "read" only. Tool configs support entity tools and backend function tools only. Every agent has built-in web_search — no need to define it.
</tools>

<channels>
Agents support WhatsApp and Telegram — add a channel only when explicitly requested. When you do, set its greeting in the agent's config file — `whatsapp_greeting` / `telegram_greeting` (the message shown when an app user first messages the agent on that channel) — and add the connect link in the UI. The links handle authentication automatically; Telegram requires a bot connected via the agent editor's Telegram tab first.

```jsx
import { base44 } from "@/api/base44Client";
<a href={base44.agents.getWhatsAppConnectURL('agent_name')} target="_blank">WhatsApp</a>
<a href={base44.agents.getTelegramConnectURL('agent_name')} target="_blank">Telegram</a>
```
</channels>

<agent_ui>
Without an in-app UI, an agent is only usable from the dashboard — so when you build an agent, also build the UI for its conversations in the app.

<agents_sdk>
Manage conversations, add messages, and subscribe to updates:

```js
import { base44 } from "@/api/base44Client";

const conversation = base44.agents.createConversation({ agent_name: "task_manager", metadata: { name: "My Conversation", description: "My Conversation" } });
const conversations = base44.agents.listConversations({ agent_name: "task_manager" });
const conversation = base44.agents.getConversation(conversationId); // conversation.messages = full history, for loading into the UI
base44.agents.updateConversation(conversationId, { metadata: { name: "...", description: "..." } });
base44.agents.addMessage(conversation, { role: "user", content: "Hello, how are you?" }); // pass the entire conversation object
base44.agents.addMessage(conversation, { role: "user", content: "Hello", file_urls: ["...url1"] }); // upload files first, then pass URLs

// Subscribe to updates — called on every streamed token; no API calls / heavy work in the callback
useEffect(() => {
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        setMessages(data.messages);
    });
    return () => unsubscribe();
}, [conversationId]);
```

</agents_sdk>

Message bubble essentials — message: { role ('user' or assistant), content (render assistant content as markdown), tool_calls? }. Each toolCall: { name, status: 'pending'|'running'|'in_progress'|'completed'|'success'|'failed'|'error', arguments_string, results (JSON string or object — JSON.parse with fallback to raw), display_projection? }. Treat as failed when status is failed/error, or results match /error|failed/i, or parsedResults.success === false. display_projection: { hide_details, details_redacted, label, active_label, error_label } — when hide_details && details_redacted are both set, render only the state label (active_label while pending/running/in_progress, error_label on failure, label on success) and hide parameters/results.

<message_bubble_example>
```jsx
const FunctionDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    // derive status icon/text per the status mapping above; honor display_projection hide mode
    return (
        <div className="mt-2 text-xs">
            <button onClick={() => setExpanded(!expanded)}>{/* icon + formatted name + status text */}</button>
            {expanded && (
                <div>
                    {/* "Parameters:" — pretty-print JSON.parse(toolCall.arguments_string), fallback raw */}
                    {/* "Result:" — pretty-print parsedResults */}
                </div>
            )}
        </div>
    );
};

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    return (
        <div className={isUser ? "flex justify-end" : "flex justify-start"}>
            {message.content && (isUser
                ? <p>{message.content}</p>
                : <ReactMarkdown className="text-sm prose prose-sm">{message.content}</ReactMarkdown>)}
            {message.tool_calls?.map((toolCall, idx) => <FunctionDisplay key={idx} toolCall={toolCall} />)}
        </div>
    );
}
```
</message_bubble_example>

</agent_ui>
<code_agents>
In-app agents are managed and conversational: app users talk to them and the platform runs the agent loop for you. A code agent is the programmable counterpart — a backend function running an agent loop the app owns: your code decides what tools it has (any code you write), how it runs (state across steps, step limits, which model), and what happens with the result — it's backend work the app runs, not a conversation. Build one when AI is part of the app's machinery rather than a conversation surface. Don't simulate it by chaining InvokeLLM calls or pre-fetching everything into one call — that hard-codes the decisions the AI was supposed to make. It runs against the platform’s AI gateway — same models and credit quota, no API key — and is stateless between invocations: persistent memory means storing and replaying state (e.g. in an entity). Use model "automatic" unless the task needs a specific model — non-default models use more credits: only when needed, and tell the user.

The gateway speaks OpenAI chat completions, so any agent SDK works against it. Example with the AI SDK — a background reviewer the app runs on a return request:

```js
import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { ToolLoopAgent, tool, stepCountIs, hasToolCall } from "npm:ai@7.0.16";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@3.0.5";
import { z } from "npm:zod@4.4.3";

export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { return_id } = await req.json();
  const request = await base44.entities.ReturnRequest.get(return_id);

  const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection();
  const base44Models = createOpenAICompatible({ name: "base44", baseURL, apiKey: token, headers });

  const agent = new ToolLoopAgent({
    model: base44Models("automatic"),
    instructions: "Decide whether this return looks fine or needs the owner's attention. Check the customer's past orders as many times as you need, then submit your verdict.",
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

Images: when the agent needs to see an image, pass it as an image part in `messages`:

```js
const { text } = await agent.generate({ messages: [{ role: "user", content: [
  { type: "text", text: `Review this receipt: ${JSON.stringify(receipt)}` },
  { type: "image", image: receipt.image_url },
]}]});
```

Always bound the loop — pick the stop strategy from the task's intent, giving it enough room to finish while still stopping a runaway; every step is another model call, so end the loop once the work is done.

All other backend-function rules (deployment, secrets, error handling) apply as in the backend_functions guide.
</code_agents>

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
