<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 agents: Agents (TanStack Start: tools are server routes)

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
Agents act as the current app user, but get no app data/server-route tools automatically.

New agents start with `"tool_configs": []`. Add only the entity/server-route permissions, plus app-user connector permissions, the agent actually needs, and tell the user which permissions you granted and why. When later adding a server route, connector-link capability, or entity capability to an existing agent, change that agent's `tool_configs` only — leave unrelated agents untouched.

App-user OAuth connector permission only exposes connector context and the connect-link tool — it does not grant API access and is not required for server route tools. Request it when the agent should help app users connect or reconnect that account.

tool_configs example:

```json
[
    {"entity_name": "ToDo", "allowed_operations": ["create", "update", "delete", "read"]},
    {"entity_name": "Participant", "allowed_operations": ["read"]},
    {"tool_name": "send_reminder", "route_path": "/api/agent/send-reminder", "method": "post", "description": "Send a reminder notification for a task. Body: {taskId: string}. Returns {sent: boolean}."}
]
```

Entity entries take `entity_name` + `allowed_operations`; server-route entries take `tool_name` (`[A-Za-z0-9_-]`, ≤64), `route_path`, `method` (lowercase: `get`, `post`, `put`, `patch` or `delete`; default `post`) + `description`. Allowed operations: "create", "update", "delete", "read" only. Tool configs support entity tools and server route tools only. Every agent has built-in web_search — no need to define it.

A server-route tool calls one of this app's server routes (`src/routes/api/…`) as the chatting app user, so the route's `requireUserRoute` and `context.getBase44()` see that user: a `GET` route receives the tool's `query` as its query string; other methods also receive `body` as the JSON request body. Agent logic that needs server code gets its own route, written for the agent: JSON in, a compact JSON result out. The agent sees only `description`, so state when to call it, the exact input fields and what it returns.
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
In-app agents are managed and conversational: app users talk to them and the platform runs the agent loop for you. A code agent is the programmable counterpart — an agent loop this app runs in its own server with TanStack AI (preinstalled): your code decides what tools it has (any server code), how many steps it takes, which model, and what happens with the result. Build one when AI is part of the app's machinery, or when the app needs its own AI chat with custom tools. Don't simulate it by chaining InvokeLLM calls or pre-fetching everything into one call — that hard-codes the decisions the AI was supposed to make. It runs against the platform’s AI gateway — same models and credit quota, no API key, streaming supported — and is stateless between requests: persistent memory means storing and replaying state (e.g. in an entity). Use model "automatic" unless the task needs a specific model — non-default models use more credits: only when needed, and tell the user.

Build the adapter with `gatewayModel(base44, model)` from `src/lib/ai.server.js`, in server code only, passing `context.getBase44()`. It calls the gateway as the app (service role), since the gateway only accepts server-side service-role calls, so authenticate the caller first. Tools keep using `context.getBase44()` and act as the caller. Every call spends the app owner's credits, so require a signed-in caller. A streaming chat is a server function that returns the `chat(...)` stream, plus `useChat` in the page:

```js
// src/lib/chat.js
import { chat, maxIterations, toolDefinition } from "@tanstack/ai";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { gatewayModel } from "@/lib/ai.server";
import { requireUser } from "@/lib/auth-middleware";

export const chatWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ messages: z.array(z.any()).max(40) }))
  .handler(({ data, context }) => {
    const base44 = context.getBase44();
    const listOrders = toolDefinition({
      name: "listOrders",
      description: "The caller's recent orders, optionally filtered by status",
      inputSchema: z.object({ status: z.string().optional() }),
    }).server(({ status }) => base44.entities.Order.filter(status ? { status } : {}, "-created_date", 20));

    return chat({
      adapter: gatewayModel(base44),
      messages: data.messages,
      systemPrompts: ["You help customers with their orders."],
      tools: [listOrders],
      agentLoopStrategy: maxIterations(5),
    });
  });
```

```jsx
// the page (per-user, so the route sets ssr: false)
import { useChat } from "@tanstack/ai-react";
import { chatWithAssistant } from "@/lib/chat";

const { messages, sendMessage, isLoading } = useChat({
  // send only the recent history: the server caps it, and a long chat would otherwise fail every turn
  fetcher: ({ messages }, { signal }) => chatWithAssistant({ data: { messages: messages.slice(-40) }, signal }),
});
// each message is { id, role, parts }: render part.content where part.type === "text"
```

Without a chat (a background reviewer, a classifier), run the loop in a server function guarded by `.middleware([requireUser])`: `await chat({ adapter, messages, tools, agentLoopStrategy, stream: false })` returns the final text, or pass `outputSchema` (a zod schema) instead of `stream: false` for typed JSON.

Images: pass an image part in a message's `content`: `[{ type: "text", content: "Review this receipt" }, { type: "image", source: { type: "url", value: receipt.image_url } }]`.

Always bound the loop with `agentLoopStrategy: maxIterations(n)` — pick n from the task's intent, giving it enough room to finish while still stopping a runaway; every step is another model call.
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
