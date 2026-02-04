# Agent with Function Fixture

This fixture tests creating an AI agent that has access to a backend function.

## Project Context

This is an e-commerce app that needs an order assistant agent capable of:
- Reading order information
- Canceling orders via a backend function

## Expected Outcome

Create both:
1. An agent config at `base44/agents/order_assistant.jsonc` with both entity and function tool access
2. A backend function at `base44/functions/cancel-order/` that handles order cancellation
