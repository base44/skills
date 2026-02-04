# Support Agent Fixture

This fixture tests creating an AI agent configuration file for a support assistant.

## Project Context

This is an existing Base44 project for an e-commerce app. It has Order and Customer entities already defined.

## Expected Outcome

Create an agent config file at `base44/agents/support_agent.jsonc` that:
- Uses the correct agent schema format
- Has `tool_configs` with entity access (not the old `tools` format)
- Includes clear instructions for the agent behavior
