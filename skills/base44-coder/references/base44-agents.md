# Agents Module

AI agent conversations and messages via `base44.agents`.

## Contents
- [Concepts](#concepts)
- [Methods](#methods)
- [Examples](#examples) (Get Conversations, List, Subscribe, Send Message)
- [Message Structure](#message-structure)
- [Conversation Structure](#conversation-structure)
- [Common Patterns](#common-patterns)

## Concepts

- **Conversation**: A dialogue between user and an AI agent. Has unique ID, agent reference, user reference, and metadata.
- **Message**: Single message in a conversation. Has role (`user`, `assistant`, `system`), content, timestamps, and optional metadata.

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConversations()` | `Promise<Conversation[]>` | Get all user's conversations |
| `getConversation(id)` | `Promise<Conversation>` | Get conversation with messages |
| `listConversations(params)` | `Promise<Conversation[]>` | Filter/sort/paginate conversations |
| `subscribeToConversation(id, onUpdate?)` | `Subscription` | Real-time updates via WebSocket |
| `addMessage(conversation, message)` | `Promise<Message>` | Send a message |

## Examples

### Get All Conversations

```javascript
const conversations = await base44.agents.getConversations();

conversations.forEach(conv => {
  console.log(conv.id, conv.agent_id, conv.created_date);
});
```

### Get Single Conversation (with messages)

```javascript
const conversation = await base44.agents.getConversation("conv-id-123");

console.log(conversation.messages);
```

### List with Filters

```javascript
const recent = await base44.agents.listConversations({
  filter: { agent_id: "my-agent" },
  sort: { created_date: -1 },
  limit: 10,
  skip: 0
});
```

### Subscribe to Updates (Real-time)

```javascript
const subscription = base44.agents.subscribeToConversation(
  "conv-id-123",
  (updatedConversation) => {
    // Called when new messages arrive
    console.log("New messages:", updatedConversation.messages);
  }
);

// Later: unsubscribe
subscription.unsubscribe();
```

### Send a Message

```javascript
const conversation = await base44.agents.getConversation("conv-id-123");

await base44.agents.addMessage(conversation, {
  role: "user",
  content: "What's the weather like today?"
});
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
  agent_id: "agent-id",
  user_id: "user-id",
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
const sub = base44.agents.subscribeToConversation(conversationId, (updated) => {
  setMessages(updated.messages);
});

// Send message
async function sendMessage(text) {
  await base44.agents.addMessage(conv, { role: "user", content: text });
}

// Cleanup on unmount
return () => sub.unsubscribe();
```
