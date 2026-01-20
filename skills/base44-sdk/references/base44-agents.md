# Agents Module

AI agent conversations and messages via `base44.agents`.

## Contents
- [Concepts](#concepts)
- [Methods](#methods)
- [Examples](#examples) (Create, Get Conversations, List, Subscribe, Send Message, WhatsApp)
- [Message Structure](#message-structure)
- [Conversation Structure](#conversation-structure)
- [Common Patterns](#common-patterns)

## Concepts

- **Conversation**: A dialogue between user and an AI agent. Has unique ID, agent name, user reference, and metadata.
- **Message**: Single message in a conversation. Has role (`user`, `assistant`, `system`), content, timestamps, and optional metadata.

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `createConversation(params)` | `Promise<Conversation>` | Create a new conversation with an agent |
| `getConversations()` | `Promise<Conversation[]>` | Get all user's conversations |
| `getConversation(id)` | `Promise<Conversation>` | Get conversation with messages |
| `listConversations(filterParams)` | `Promise<Conversation[]>` | Filter/sort/paginate conversations |
| `subscribeToConversation(id, onUpdate?)` | `() => void` | Real-time updates via WebSocket (returns unsubscribe function) |
| `addMessage(conversation, message)` | `Promise<Message>` | Send a message |
| `getWhatsAppConnectURL(agentName)` | `string` | Get WhatsApp connection URL for agent |

## Examples

### Create Conversation

```javascript
const conversation = await base44.agents.createConversation({
  agent_name: "support-agent",
  metadata: {
    order_id: "ORD-123",
    category: "billing"
  }
});

console.log(conversation.id);
```

### Get All Conversations

```javascript
const conversations = await base44.agents.getConversations();

conversations.forEach(conv => {
  console.log(conv.id, conv.agent_name, conv.created_date);
});
```

### Get Single Conversation (with messages)

```javascript
const conversation = await base44.agents.getConversation("conv-id-123");

console.log(conversation.messages);
```

### List with Filters

```javascript
// Using filterParams object with q, sort, limit, skip, fields
const recent = await base44.agents.listConversations({
  q: { agent_name: "support-agent" },
  sort: "-created_date",
  limit: 10,
  skip: 0
});

// Filter by metadata
const highPriority = await base44.agents.listConversations({
  q: {
    agent_name: "support-agent",
    "metadata.priority": "high"
  },
  sort: "-updated_date",
  limit: 20
});
```

### Subscribe to Updates (Real-time)

```javascript
const unsubscribe = base44.agents.subscribeToConversation(
  "conv-id-123",
  (updatedConversation) => {
    // Called when new messages arrive
    console.log("New messages:", updatedConversation.messages);
  }
);

// Later: unsubscribe
unsubscribe();
```

### Send a Message

```javascript
const conversation = await base44.agents.getConversation("conv-id-123");

await base44.agents.addMessage(conversation, {
  role: "user",
  content: "What's the weather like today?"
});
```

### Get WhatsApp Connection URL

```javascript
const whatsappUrl = base44.agents.getWhatsAppConnectURL("support-agent");
// Returns URL for users to connect with agent via WhatsApp
console.log(whatsappUrl);
```

## Message Structure

```javascript
{
  role: "user" | "assistant" | "system",
  content: "Message text or structured object",
  created_date: "2024-01-15T10:30:00Z",
  updated_date: "2024-01-15T10:30:00Z",
  
  // Optional fields
  reasoning: {
    content: "Agent's reasoning process",
    timing: 1500
  },
  tool_calls: [{
    name: "search",
    arguments: { query: "weather" },
    result: { ... },
    status: "success"
  }],
  file_urls: ["https://..."],
  usage: {
    prompt_tokens: 150,
    completion_tokens: 50
  },
  metadata: { ... },
  custom_context: { ... }
}
```

## Conversation Structure

```javascript
{
  id: "conv-id-123",
  app_id: "app-id",
  agent_name: "support-agent",
  created_by_id: "user-id",
  created_date: "2024-01-15T10:00:00Z",
  updated_date: "2024-01-15T10:30:00Z",
  messages: [ ... ],
  metadata: { ... }
}
```

## Common Patterns

### Chat Interface

```javascript
// Load conversation
const conv = await base44.agents.getConversation(conversationId);
setMessages(conv.messages);

// Subscribe to updates
const unsubscribe = base44.agents.subscribeToConversation(conversationId, (updated) => {
  setMessages(updated.messages);
});

// Send message
async function sendMessage(text) {
  await base44.agents.addMessage(conv, { role: "user", content: text });
}

// Cleanup on unmount
return () => unsubscribe();
```
